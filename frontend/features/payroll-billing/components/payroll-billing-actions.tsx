"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Decimal from "decimal.js";
import { cloneElement, useRef, useState, type ReactElement } from "react";
import { useForm, useWatch, type FieldErrors, type FieldValues, type Path, type UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button, Modal } from "@/components/ui";
import type { PayrollBillingRunDetail, PayrollMutationResult } from "../domain/types";
import { mapPayrollBillingMutationError, type PayrollMutationErrorView } from "../domain/mutation-error";
import { payrollPermission, resolvePayrollCapabilities } from "../permissions/capabilities";
import { useAdjustPayrollBilling, useLockPayrollBilling, useRecalculatePayrollBilling, useRejectPayrollBilling, useReviewPayrollBilling } from "../queries/hooks";
import { PayrollMutationFeedback } from "./payroll-mutation-feedback";
import { useUnsavedGuard } from "./use-unsaved-guard";

type Action = "adjust" | "recalculate" | "review" | "reject" | "lock";
type MutationAccess = "manage" | "review" | "view" | "none";
const labels: Record<Action, string> = { adjust: "Adjustment", recalculate: "Recalculate", review: "Review", reject: "Reject", lock: "Lock" };

const reasonSchema = z.object({
  reason: z.string().trim().min(3, "Alasan minimal 3 karakter."),
  attestation: z.boolean().optional(),
});
const attestedReasonSchema = reasonSchema.refine((value) => value.attestation === true, { path: ["attestation"], message: "Attestation wajib dikonfirmasi." });
const adjustmentSchema = z.object({
  scope: z.enum(["Run", "Line"]),
  lineId: z.string().optional(),
  type: z.enum(["Addition", "Deduction"]),
  amount: z.string().trim().refine((value) => {
    try { return new Decimal(value).isPositive() && !/[eE]/.test(value); } catch { return false; }
  }, "Amount decimal harus lebih dari nol."),
  reason: z.string().trim().min(3, "Alasan minimal 3 karakter."),
  note: z.string().max(500, "Catatan maksimal 500 karakter.").optional(),
}).superRefine((value, context) => {
  if (value.scope === "Line" && !value.lineId) context.addIssue({ code: "custom", path: ["lineId"], message: "Target line wajib dipilih." });
});
type ReasonValues = z.infer<typeof reasonSchema>;
type AdjustmentValues = z.infer<typeof adjustmentSchema>;

export function PayrollBillingActions({ detail, access }: { detail: PayrollBillingRunDetail; access: string }) {
  const capabilities = resolvePayrollCapabilities(access);
  const safeAccess: MutationAccess = access === "manage" || access === "review" || access === "view" ? access : "none";
  const [action, setAction] = useState<Action>();
  const [error, setError] = useState<PayrollMutationErrorView>();
  const adjust = useAdjustPayrollBilling();
  const recalculate = useRecalculatePayrollBilling();
  const review = useReviewPayrollBilling();
  const reject = useRejectPayrollBilling();
  const lock = useLockPayrollBilling();
  const revision = detail.revisions.find((item) => item.id === detail.run.currentRevisionId) ?? detail.revisions[0];
  const eligible: Record<Action, boolean> = {
    adjust: ["Draft", "Calculated", "Needs Review"].includes(detail.run.status),
    recalculate: ["Calculated", "Needs Review", "Rejected"].includes(detail.run.status),
    review: detail.run.status === "Needs Review" && detail.readiness.readyToReview,
    reject: ["Needs Review", "Reviewed"].includes(detail.run.status),
    lock: detail.run.status === "Reviewed" && detail.readiness.readyToLock,
  };
  const open = (next: Action) => { setError(undefined); setAction(next); };
  const close = () => { setError(undefined); setAction(undefined); };

  return <>
    <div className="action-bar" aria-label="Tindakan Payroll Billing">
      {(["adjust", "recalculate", "review", "reject", "lock"] as const).map((item) => capabilities[item] &&
        <Button key={item} variant={item === "reject" ? "danger" : "secondary"} disabled={!eligible[item]} title={!eligible[item] ? `Tidak tersedia pada status ${detail.run.status}` : undefined} onClick={() => open(item)}>{labels[item]}</Button>)}
    </div>
    {action === "adjust" ? <AdjustmentForm detail={detail} access={safeAccess} open onClose={close} error={error} setError={setError} mutate={(values) => adjust.mutateAsync({
      data: { runId: detail.run.id, revisionId: revision.id, revisionVersion: revision.version, scope: values.scope, lineId: values.scope === "Line" ? values.lineId : undefined, type: values.type, amount: values.amount, currency: detail.run.currency, note: values.note || undefined },
      actor: { userId: "usr-demo", permissionKeys: [payrollPermission("adjust")] }, reason: values.reason, currentVersion: detail.run.version,
    })} /> : action ? <ReasonForm action={action} detail={detail} access={safeAccess} open onClose={close} error={error} setError={setError} mutate={(values) => {
      const base = { data: { runId: detail.run.id, revisionId: revision.id, revisionVersion: revision.version }, actor: { userId: "usr-demo", permissionKeys: [payrollPermission(action)] }, reason: values.reason, currentVersion: detail.run.version };
      if (action === "recalculate") return recalculate.mutateAsync(base);
      if (action === "review") return review.mutateAsync({ ...base, data: { ...base.data, attestation: Boolean(values.attestation) } });
      if (action === "reject") return reject.mutateAsync(base);
      return lock.mutateAsync({ ...base, data: { ...base.data, attestation: Boolean(values.attestation) } });
    }} /> : null}
  </>;
}

type SharedFormProps = { detail: PayrollBillingRunDetail; access: MutationAccess; open: boolean; onClose: () => void; error?: PayrollMutationErrorView; setError: (value: PayrollMutationErrorView | undefined) => void };

function applyServerErrors<T extends FieldValues>(form: UseFormReturn<T>, error: PayrollMutationErrorView) {
  for (const [field, messages] of Object.entries(error.fieldErrors)) form.setError(field as Path<T>, { type: "server", message: messages.join(" ") });
}

function firstErrorName(errors: FieldErrors): string | undefined { return Object.keys(errors)[0]; }

function AdjustmentForm({ detail, access, open, onClose, error, setError, mutate }: SharedFormProps & { mutate: (values: AdjustmentValues) => Promise<PayrollMutationResult> }) {
  const form = useForm<AdjustmentValues>({ resolver: zodResolver(adjustmentSchema), defaultValues: { scope: "Run", lineId: "", type: "Addition", amount: "", reason: "", note: "" } });
  const scope = useWatch({ control: form.control, name: "scope" });
  const guard = useUnsavedGuard(form.formState.isDirty);
  const [reviewing, setReviewing] = useState(false);
  const [pending, setPending] = useState(false);
  const [retryValues, setRetryValues] = useState<AdjustmentValues>();
  const submit = form.handleSubmit(() => setReviewing(true));
  const execute = async (values: AdjustmentValues) => {
    if (pending) return;
    const attemptedValues = { ...values };
    setRetryValues(attemptedValues);
    setPending(true); setError(undefined); form.clearErrors();
    try { await mutate(attemptedValues); toast.success("Adjustment berhasil dan revision baru tersedia."); form.reset(); setReviewing(false); onClose(); }
    catch (value) { const mapped = mapPayrollBillingMutationError(value); if (!mapped.cancelled) { applyServerErrors(form, mapped); setError(mapped); } }
    finally { setPending(false); }
  };
  const confirm = form.handleSubmit(execute);
  const close = () => guard(() => { form.reset(); setReviewing(false); onClose(); });
  return <Modal open={open} title="Adjustment Payroll Billing" description={`Current revision ${detail.run.revisionNumber} · source snapshot tidak berubah`} onClose={close} footer={<>
    <Button variant="secondary" disabled={pending} onClick={close}>Batal</Button>
    {reviewing && <Button variant="secondary" disabled={pending} onClick={() => setReviewing(false)}>Kembali</Button>}
    <Button disabled={pending} onClick={() => void (reviewing ? confirm() : submit())}>{pending ? "Menyimpan…" : reviewing ? "Konfirmasi adjustment" : "Tinjau adjustment"}</Button>
  </>}>
    {error && <PayrollMutationFeedback action="Adjustment" error={error} runId={detail.run.id} access={access} onBack={() => setError(undefined)} onRetry={() => retryValues && void execute(retryValues)} retryPending={pending} />}
    <p>Current total: <strong>{detail.run.summary.grandTotal} {detail.run.currency}</strong>. Mutation membuat revision baru; tidak ada target total palsu sebelum respons authoritative.</p>
    <form onSubmit={(event) => { event.preventDefault(); void (reviewing ? confirm() : submit()); }} noValidate>
      <ErrorSummary errors={form.formState.errors} />
      <Field id="adjustment-scope" label="Scope" error={form.formState.errors.scope?.message}><select {...form.register("scope")}><option value="Run">Run</option><option value="Line">Line</option></select></Field>
      {scope === "Line" && <Field id="adjustment-line" label="Target line" error={form.formState.errors.lineId?.message}><select {...form.register("lineId")}><option value="">Pilih line</option>{detail.lines.map((line) => <option key={line.id} value={line.id}>{line.employeeReference} · {line.finalAmount}</option>)}</select></Field>}
      <Field id="adjustment-type" label="Type" error={form.formState.errors.type?.message}><select {...form.register("type")}><option value="Addition">Addition</option><option value="Deduction">Deduction</option></select></Field>
      <Field id="adjustment-amount" label="Amount" error={form.formState.errors.amount?.message}><input inputMode="decimal" {...form.register("amount")} /></Field>
      <Field id="adjustment-currency" label="Currency"><input value={detail.run.currency} readOnly /></Field>
      <Field id="adjustment-reason" label="Reason" error={form.formState.errors.reason?.message}><textarea {...form.register("reason")} /></Field>
      <Field id="adjustment-note" label="Supporting note" error={form.formState.errors.note?.message}><textarea {...form.register("note")} /></Field>
    </form>
    {reviewing && <section aria-label="Review adjustment"><h3>Review adjustment</h3><p>{form.getValues("scope")} · {form.getValues("type")} · {form.getValues("amount")} {detail.run.currency}</p><p>{form.getValues("reason")}</p><p>Revision {detail.run.currentRevisionId} akan tetap menjadi history immutable; revision baru dibuat setelah respons server.</p></section>}
  </Modal>;
}

function ReasonForm({ action, detail, access, open, onClose, error, setError, mutate }: SharedFormProps & { action: Exclude<Action, "adjust">; mutate: (values: ReasonValues) => Promise<PayrollMutationResult> }) {
  const attestation = action === "review" || action === "lock";
  const form = useForm<ReasonValues>({ resolver: zodResolver(attestation ? attestedReasonSchema : reasonSchema), defaultValues: { reason: "", attestation: false } });
  const guard = useUnsavedGuard(form.formState.isDirty);
  const [pending, setPending] = useState(false);
  const [retryValues, setRetryValues] = useState<ReasonValues>();
  const execute = async (values: ReasonValues) => {
    if (pending) return;
    const attemptedValues = { ...values };
    setRetryValues(attemptedValues);
    setPending(true); setError(undefined); form.clearErrors();
    try { await mutate(attemptedValues); toast.success(`${labels[action]} berhasil.`); form.reset(); onClose(); }
    catch (value) { const mapped = mapPayrollBillingMutationError(value); if (!mapped.cancelled) { applyServerErrors(form, mapped); setError(mapped); } }
    finally { setPending(false); }
  };
  const submit = form.handleSubmit(execute);
  const close = () => guard(() => { form.reset(); onClose(); });
  const revision = detail.revisions.find((item) => item.id === detail.run.currentRevisionId) ?? detail.revisions[0];
  return <Modal open={open} title={`${labels[action]} Payroll Billing`} description={`Run ${detail.run.id} · Revision ${detail.run.revisionNumber} · ${detail.run.status}`} onClose={close} footer={<>
    <Button variant="secondary" disabled={pending} onClick={close}>Batal</Button>
    <Button variant={action === "reject" ? "danger" : "primary"} disabled={pending} onClick={() => void submit()}>{pending ? "Memproses…" : labels[action]}</Button>
  </>}>
    {error && <PayrollMutationFeedback action={labels[action]} error={error} runId={detail.run.id} access={access} onBack={() => setError(undefined)} onRetry={() => retryValues && void execute(retryValues)} retryPending={pending} />}
    <ActionContext action={action} detail={detail} revisionReason={revision.reason} />
    <form onSubmit={(event) => { event.preventDefault(); void submit(); }} noValidate>
      <ErrorSummary errors={form.formState.errors} />
      <Field id={`${action}-reason`} label={action === "reject" ? "Reason penolakan" : "Comment / reason"} error={form.formState.errors.reason?.message}><textarea {...form.register("reason")} /></Field>
      {attestation && <CheckboxField id={`${action}-attestation`} label="Attestation" error={form.formState.errors.attestation?.message}><input type="checkbox" {...form.register("attestation")} /></CheckboxField>}
    </form>
  </Modal>;
}

function ActionContext({ action, detail, revisionReason }: { action: Exclude<Action, "adjust">; detail: PayrollBillingRunDetail; revisionReason: string }) {
  const source = detail.run.source;
  return <>
    <dl className="detail-list">
      <dt>Run / revision</dt><dd>{detail.run.id} · Revision {detail.run.revisionNumber}</dd>
      <dt>Status</dt><dd>{detail.run.status}</dd>
      <dt>Project / customer</dt><dd>{source.projectLabel} · {source.customerLabel}</dd>
      <dt>Period</dt><dd>{source.attendancePeriod}</dd>
      <dt>Attendance source</dt><dd>{source.attendanceBatchId} · Revision {source.attendanceRevision}</dd>
      <dt>SPH</dt><dd>{source.sphLabel}</dd><dt>Rate Version</dt><dd>{source.rateVersionLabel}</dd>
      <dt>Base subtotal</dt><dd>{detail.run.summary.baseAmount} {detail.run.currency}</dd>
      <dt>Components</dt><dd>Management fee {detail.run.summary.managementFee}; other charges {detail.run.summary.otherCharges}</dd>
      <dt>Adjustment</dt><dd>{detail.run.summary.adjustmentAmount}</dd>
      <dt>Tax / withholding</dt><dd>{detail.run.summary.withholdingAmount ?? "Tidak berlaku"}</dd>
      <dt>Rounding</dt><dd>{detail.run.summary.roundingAmount}</dd>
      <dt>Grand total</dt><dd>{detail.run.summary.grandTotal} {detail.run.currency}</dd>
      <dt>Exception / blocker</dt><dd>{detail.run.exceptionCount} exception · {detail.exceptions.filter((item) => item.blocking).length} blocking</dd>
      <dt>Reconciliation / variance</dt><dd>{detail.reconciliation.reconciled ? "Reconciled" : "Tidak reconciled"} · {detail.reconciliation.variance}</dd>
      {action === "lock" && <><dt>Reviewed</dt><dd>{detail.run.reviewedByUserId ?? "Belum tersedia"} · {detail.run.reviewedAt ?? "Belum tersedia"}</dd><dt>Readiness</dt><dd>{detail.readiness.readyToLock ? "Siap Lock" : detail.readiness.blockers.join("; ")}</dd></>}
    </dl>
    <p role="note"><strong>Riwayat immutable:</strong> revision saat ini tidak ditimpa. {revisionReason}</p>
    {action === "recalculate" && <p role="note">Recalculate membuat revision baru; hasil finansial menunggu respons authoritative.</p>}
    {action === "lock" && <p role="note"><strong>Setelah Lock:</strong> Adjustment, Recalculate, dan Reject tidak tersedia. Tidak ada Unlock.</p>}
  </>;
}

function ErrorSummary({ errors }: { errors: FieldErrors }) {
  const ref = useRef<HTMLDivElement>(null);
  const name = firstErrorName(errors);
  if (!name) return null;
  return <div ref={ref} tabIndex={-1} role="alert" aria-label="Ringkasan kesalahan form"><strong>Periksa kembali input.</strong><Button variant="secondary" onClick={() => document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus()}>Ke field pertama</Button></div>;
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactElement<{ id?: string; "aria-invalid"?: boolean; "aria-describedby"?: string }> }) {
  const description = `${id}-error`;
  const control = cloneElement(children, { id, "aria-invalid": error ? true : undefined, "aria-describedby": error ? description : undefined });
  return <div className="field"><label className="field-label" htmlFor={id}>{label}</label>{control}{error && <p id={description} className="field-error" role="alert">{error}</p>}</div>;
}

function CheckboxField({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactElement<{ id?: string; "aria-invalid"?: boolean; "aria-describedby"?: string }> }) {
  const description = `${id}-error`;
  const control = cloneElement(children, { id, "aria-invalid": error ? true : undefined, "aria-describedby": error ? description : undefined });
  return <div className="field"><div className="checkbox-field">{control}<label htmlFor={id}>{label}: Saya telah meninjau sumber, exception, reconciliation, dan memahami state authoritative.</label></div>{error && <p id={description} className="field-error" role="alert">{error}</p>}</div>;
}
