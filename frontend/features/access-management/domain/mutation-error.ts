import { z } from "zod";
import { AppError, isRequestCancellation, normalizeAppError } from "@/features/foundation/domain/errors";

const diffSchema = z.object({ field: z.string(), label: z.string(), before: z.string(), after: z.string() });
const conflictSchema = z.object({ userVersion: z.number(), latestVersion: z.number(), diffs: z.array(diffSchema), currentStatus: z.enum(["Active", "Inactive"]).optional(), targetStatus: z.enum(["Active", "Inactive"]).optional() });
const findingSchema = z.object({ ruleId: z.literal("SOD-ADMIN-FINAL-APPROVAL"), severity: z.literal("Critical"), permissionKeys: z.array(z.enum(["access.view", "access.manage", "project.view", "project.manage", "pic.approve"])), explanation: z.string(), guidance: z.string(), blocking: z.literal(true) });
const sodSchema = z.object({ findings: z.array(findingSchema) });

export type AccessConflictMetadata = z.infer<typeof conflictSchema>;
export type AccessSodMetadata = z.infer<typeof sodSchema>;
export type AccessField = "employeeId" | "name" | "email" | "roleIds" | "projectScopeIds" | "code" | "description" | "permissionKeys" | "reason" | "target";
export interface AccessMutationErrorView { status: AppError["status"]; code: string; message: string; fieldErrors: Partial<Record<AccessField, readonly string[]>>; globalErrors: readonly string[]; retryable: boolean; correlationId: string; conflict?: AccessConflictMetadata; sod?: AccessSodMetadata; }
const fields = new Set<AccessField>(["employeeId", "name", "email", "roleIds", "projectScopeIds", "code", "description", "permissionKeys", "reason", "target"]);

export function mapAccessMutationError(error: unknown): AccessMutationErrorView {
  if (isRequestCancellation(error)) throw error;
  const normalized = normalizeAppError(error);
  const fieldErrors: Partial<Record<AccessField, readonly string[]>> = {};
  const globalErrors: string[] = [];
  for (const [field, messages] of Object.entries(normalized.field_errors)) {
    if (fields.has(field as AccessField)) fieldErrors[field as AccessField] = messages;
    else globalErrors.push(...messages.map(message => `${field}: ${message}`));
  }
  const conflict = conflictSchema.safeParse(normalized.metadata);
  const sod = sodSchema.safeParse(normalized.metadata);
  if (!Object.keys(fieldErrors).length && !globalErrors.length) globalErrors.push(normalized.message);
  return { status: normalized.status, code: normalized.code, message: normalized.message, fieldErrors, globalErrors, retryable: normalized.retryable && [500, 502, 503].includes(normalized.status), correlationId: normalized.correlation_id, conflict: conflict.success ? conflict.data : undefined, sod: sod.success ? sod.data : undefined };
}
