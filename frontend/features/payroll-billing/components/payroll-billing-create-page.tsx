"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Badge, Button, Card, CardHeader, DataState, Input, LoadingState, PageHeader, Select } from "@/components/ui";
import { isRequestCancellation } from "@/features/foundation/domain/errors";
import { mapPayrollBillingMutationError } from "../domain/mutation-error";
import { useCreatePayrollBilling, usePayrollBillingSourceOptions } from "../queries/hooks";
import { useUnsavedGuard } from "./use-unsaved-guard";

export function PayrollBillingCreatePage({ access = "manage" }: { access?: string }) {
  if (access !== "manage") return <DataState kind="denied" title="Create Payroll Billing tidak diizinkan" description="Persona ini hanya dapat mengakses fungsi sesuai kewenangannya." />;
  return <AuthorizedPayrollBillingCreate access={access} />;
}

function AuthorizedPayrollBillingCreate({ access }: { access: string }) {
  const router = useRouter();
  const [sourceId, setSourceId] = useState("");
  const [reason, setReason] = useState("");
  const [review, setReview] = useState(false);
  const [error, setError] = useState<ReturnType<typeof mapPayrollBillingMutationError>>();
  const options = usePayrollBillingSourceOptions(access, access === "manage");
  const create = useCreatePayrollBilling();
  const dirty = Boolean(sourceId || reason || review);
  const guard = useUnsavedGuard(dirty);
  const selectedId = sourceId || options.data?.[0]?.attendanceBatchId || "";
  const selected = options.data?.find((item) => item.attendanceBatchId === selectedId);
  const submit = async () => {
    if (!selected || create.isPending) return;
    setError(undefined);
    try {
      const result = await create.mutateAsync({ data: { attendanceBatchId: selected.attendanceBatchId, projectId: selected.projectId, period: selected.attendancePeriod, sphId: selected.sphId }, actor: { userId: "usr-demo", permissionKeys: ["payroll-billing.create"] }, reason });
      router.push(`/payroll-billing/${result.runId}?access=${access}`);
    } catch (value) { if (!isRequestCancellation(value)) setError(mapPayrollBillingMutationError(value)); }
  };
  const cancel = () => guard(() => router.push(`/payroll-billing?access=${access}`));
  return <><PageHeader eyebrow="Create Payroll Billing Run" title="Pilih source authoritative" description="Source berasal dari repository eligibility; preview tidak membuat hasil finansial optimistis." meta={<Badge tone="warning">Data demo</Badge>} />
    {error && <Alert tone="danger" title="Run belum dapat dibuat"><p>{error.safeMessage}</p><p>Kode: {error.safeCode}</p>{error.correlationId && <code>ID korelasi: {error.correlationId}</code>}</Alert>}
    {options.isPending ? <div role="status" aria-label="Memuat source Payroll Billing"><LoadingState /></div> : options.isError ? <DataState kind="server" title="Source belum dapat dimuat" description={mapPayrollBillingMutationError(options.error).safeMessage} action={<Button variant="secondary" onClick={() => void options.refetch()}>Coba lagi</Button>} /> : options.data?.length === 0 ? <DataState kind="empty" title="Tidak ada Locked Attendance yang eligible" description="Pastikan Project, period, SPH, dan Rate Version sudah applicable." /> : <Card><CardHeader title="Source selection" /><div className="form-section"><Select label="Locked Attendance source" value={selectedId} onChange={(event) => setSourceId(event.currentTarget.value)}>{options.data?.map((item) => <option key={item.attendanceBatchId} value={item.attendanceBatchId}>{item.attendanceBatchId} / Revision {item.attendanceRevision} / {item.projectLabel} / {item.attendancePeriod}</option>)}</Select>{selected && <dl className="detail-list"><dt>Project / customer</dt><dd>{selected.projectLabel} / {selected.customerLabel}</dd><dt>Attendance Locked</dt><dd>{selected.attendanceBatchId} / Revision {selected.attendanceRevision} / {selected.attendanceRows} row</dd><dt>Period</dt><dd>{selected.attendancePeriod}</dd><dt>SPH</dt><dd>{selected.sphLabel}</dd><dt>Rate Version</dt><dd>{selected.rateVersionLabel} / {selected.currency}/{selected.unit}</dd></dl>}<Input label="Calculation reason / run note" value={reason} onChange={(event) => setReason(event.target.value)} /><div className="responsive-actions"><Button variant="secondary" onClick={cancel}>Batal</Button><Button disabled={!selected || reason.trim().length < 3} onClick={() => setReview(true)}>Tinjau create</Button></div></div></Card>}
    {review && selected && <Card><CardHeader title="Review sebelum create" /><dl className="review-list"><dt>Attendance</dt><dd>{selected.attendanceBatchId} / R{selected.attendanceRevision}</dd><dt>Project / period</dt><dd>{selected.projectLabel} / {selected.attendancePeriod}</dd><dt>SPH</dt><dd>{selected.sphLabel}</dd><dt>Rate snapshot</dt><dd>{selected.rateVersionLabel}</dd><dt>Reason</dt><dd>{reason}</dd></dl><p className="form-section">Source snapshot disimpan immutable. Total dan calculation result hanya ditampilkan setelah respons authoritative.</p><div className="form-actions"><Button variant="secondary" disabled={create.isPending} onClick={() => setReview(false)}>Kembali</Button><Button disabled={create.isPending} onClick={() => void submit()}>{create.isPending ? "Membuat..." : "Buat Payroll Billing Run"}</Button></div></Card>}
  </>;
}
