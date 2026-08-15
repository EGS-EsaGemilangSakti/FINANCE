import { AppError, isRequestCancellation } from "@/features/foundation/domain/errors";
import type { PayrollReferenceIssue, PayrollRevisionDiff } from "./types";

const fields = new Set(["projectId", "attendanceBatchId", "period", "reason", "note", "attestation", "amount", "type", "lineId"]);
export interface PayrollMutationConflict { attemptedVersion?: number; latestVersion?: number; attemptedRevisionId?: string; latestRevisionId?: string; attemptedRevisionVersion?: number; latestRevisionVersion?: number; attemptedStatus?: string; latestStatus?: string; diff?: PayrollRevisionDiff; recovery?: { runId: string; preserveInput: true } }
export interface PayrollMutationErrorView { fieldErrors: Readonly<Record<string, readonly string[]>>; globalErrors: readonly string[]; retryable: boolean; correlationId: string; conflict?: PayrollMutationConflict; readinessIssues: readonly string[]; referenceIssues: readonly PayrollReferenceIssue[]; reconciliationIssue?: string; safeCode: string; safeMessage: string; cancelled: boolean }
const safeServer = "Layanan Payroll Billing sedang bermasalah. Coba kembali dan sertakan ID korelasi bila masalah berlanjut.";

const numberValue = (value: unknown) => typeof value === "number" ? value : undefined;
const stringValue = (value: unknown) => typeof value === "string" ? value : undefined;
const isRevisionDiff = (value: unknown): value is PayrollRevisionDiff => typeof value === "object" && value !== null && "source" in value && "target" in value && "summary" in value;

export function mapPayrollBillingMutationError(error: unknown): PayrollMutationErrorView {
  if (isRequestCancellation(error)) return { fieldErrors: {}, globalErrors: [], retryable: false, correlationId: "", readinessIssues: [], referenceIssues: [], safeCode: "REQUEST_CANCELLED", safeMessage: "", cancelled: true };
  const app = error instanceof AppError ? error : new AppError(500, "UNEXPECTED_ERROR", safeServer, {}, true, "unexpected-payroll");
  const fieldErrors: Record<string, readonly string[]> = {};
  const globalErrors: string[] = [];
  for (const [key, messages] of Object.entries(app.field_errors)) {
    if (fields.has(key)) fieldErrors[key] = messages;
    else globalErrors.push(...messages);
  }
  const metadata = app.metadata;
  const conflict: PayrollMutationConflict | undefined = app.status === 409 ? {
    attemptedVersion: numberValue(metadata.attemptedVersion) ?? numberValue(metadata.userVersion), latestVersion: numberValue(metadata.latestVersion),
    attemptedRevisionId: stringValue(metadata.attemptedRevisionId), latestRevisionId: stringValue(metadata.latestRevisionId),
    attemptedRevisionVersion: numberValue(metadata.attemptedRevisionVersion), latestRevisionVersion: numberValue(metadata.latestRevisionVersion),
    attemptedStatus: stringValue(metadata.attemptedStatus), latestStatus: stringValue(metadata.latestStatus),
    diff: isRevisionDiff(metadata.diff) ? metadata.diff : undefined,
    recovery: typeof metadata.runId === "string" ? { runId: metadata.runId, preserveInput: true } : undefined,
  } : undefined;
  const referenceIssues = Array.isArray(metadata.referenceIssues) ? metadata.referenceIssues.filter((item): item is PayrollReferenceIssue => typeof item === "object" && item !== null && "code" in item) : [];
  const readinessIssues = Array.isArray(metadata.readinessIssues) ? metadata.readinessIssues.filter((item): item is string => typeof item === "string") : [];
  const reconciliationIssue = stringValue(metadata.reconciliationIssue);
  const server = app.status >= 500;
  const message = server ? safeServer : app.message;
  return { fieldErrors, globalErrors: [...globalErrors, ...(Object.keys(fieldErrors).length || globalErrors.length ? [] : [message])], retryable: server && app.retryable, correlationId: app.correlation_id, conflict, readinessIssues, referenceIssues, reconciliationIssue, safeCode: app.code, safeMessage: message, cancelled: false };
}
