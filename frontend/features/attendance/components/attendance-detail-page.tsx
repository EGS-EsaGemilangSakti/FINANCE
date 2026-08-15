"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Alert, Badge, Button, Card, CardHeader, DataState, Input, LoadingState, Modal, PageHeader, StatusBadge, TableShell } from "@/components/ui";
import { AppError, isRequestCancellation, normalizeAppError } from "@/features/foundation/domain/errors";
import { formatDate } from "@/lib/formatters";
import type { AttendanceIssueQuery } from "../domain/types";
import { useAttendanceAccess } from "../permissions/demo-access";
import { useAttendanceActivity, useAttendanceDetail, useAttendanceIssues, useLockAttendance, useRejectAttendance, useValidateAttendance } from "../queries/hooks";
import { AttendanceIssueToolbar } from "./attendance-issue-toolbar";
import { AttendanceConflictDetails } from "./attendance-conflict-details";
import { mapAttendanceMutationError } from "../domain/mutation-error";
const mapActivityError = normalizeAppError;
export function AttendanceDetailPage({ id }: { id: string }) { const access = useAttendanceAccess(); const params = useSearchParams(); const issueQuery: AttendanceIssueQuery = { search: params.get("issueSearch") ?? undefined, severities: params.get("severity") ? [params.get("severity") as "Error" | "Warning" | "Duplicate"] : [], page: Math.max(1, Number(params.get("issuePage") || 1)), pageSize: [10, 20, 50].includes(Number(params.get("issuePageSize"))) ? Number(params.get("issuePageSize")) : 20, sort: params.get("issueSort") === "severity" ? "severity" : "rowNumber", direction: params.get("issueDirection") === "desc" ? "desc" : "asc" }; const detail = useAttendanceDetail(id, access.canView); const activity = useAttendanceActivity(id, access.canView); const issues = useAttendanceIssues(id, issueQuery, access.canView); const validate = useValidateAttendance(); const lock = useLockAttendance(); const reject = useRejectAttendance(); const [action, setAction] = useState<"validate" | "lock" | "reject">(); const [reason, setReason] = useState(""); const [failure, setFailure] = useState<AppError>(); const [success, setSuccess] = useState(""); if (!access.canView) return <DataState kind="denied" title="Akses attendance ditolak" />; if (detail.isPending) return <LoadingState />; if (detail.isError) return <DataState kind={normalizeAppError(detail.error).status === 404 ? "empty" : normalizeAppError(detail.error).status === 403 ? "denied" : "server"} correlationId={normalizeAppError(detail.error).correlation_id} action={normalizeAppError(detail.error).retryable ? <Button onClick={() => detail.refetch()}>
Coba lagi
</Button> : undefined} />;
const { batch, readiness } = detail.data;
const command = { data: { batchId: id }, actor: access.actor, reason, currentVersion: batch.version };
const commit = async () => {
  if (!action) return;
  try {
    setFailure(undefined);
    const response = action === "validate" ? await validate.mutateAsync({ ...command, data: { batchId: id, commitDecision: "CommitAll" } }) : action === "lock" ? await lock.mutateAsync(command) : await reject.mutateAsync(command);
    setSuccess(`${response.message} · ${response.correlationId}`);
    setAction(undefined);
    setReason("");
  } catch (error) {
    if (isRequestCancellation(error)) return;
    const normalized = normalizeAppError(error);
    setFailure(normalized);
    if (!normalized.retryable && normalized.status !== 409) setAction(undefined);
  }
};
const canValidate = batch.status === "Imported";
const canLock = batch.status === "Validated";
const canCorrect = ["Imported", "Validated", "Locked", "Rejected"].includes(batch.status);
const conflict = failure?.status === 409 ? mapAttendanceMutationError(failure).conflict : undefined;
return <>
<PageHeader eyebrow="Attendance Batch" title={`${batch.projectLabel} · ${batch.period}`} description={`Revision ${batch.revisionNumber} · Versi ${batch.version}`} meta={<>
<StatusBadge tone={batch.status === "Locked" || batch.status === "Validated" ? "success" : batch.status === "Rejected" ? "danger" : "warning"}>
{batch.status}
</StatusBadge>
<Badge tone="warning">
Data demo
</Badge>
</>} actions={<>
<Link className="button button-secondary" href={access.url("/attendance")}>
Kembali
</Link>
{access.canManage && canCorrect && <Link className="button button-secondary" href={access.url(`/attendance/import`, new URLSearchParams({ correctionOf: id }))}>
Buat correction
</Link>}
{access.canManage && canValidate && <Button onClick={() => setAction("validate")}>
Validasi batch
</Button>}
{access.canManage && canLock && <Button onClick={() => setAction("lock")}>
Kunci batch
</Button>}
{access.canManage && (canValidate || canLock) && <Button variant="danger" onClick={() => setAction("reject")}>
Tolak
</Button>}
</>} />
{success && <Alert tone="success" title={success} />}
{failure && <Alert tone="danger" title={`${failure.code}: ${failure.message}`}>
<small>
ID korelasi:
{failure.correlation_id}
</small>
{failure.retryable && <Button onClick={() => void commit()} disabled={validate.isPending || lock.isPending || reject.isPending}>
Coba lagi
</Button>}
{conflict && <div tabIndex={-1} aria-live="assertive">
<h2>{action === "reject" ? "Conflict saat menolak batch" : action === "lock" ? "Conflict saat mengunci batch" : "Conflict Attendance"}</h2>
<p>Batch {batch.id} telah berubah di tempat lain. Tinjau data authoritative terbaru sebelum melanjutkan.</p>
<p>Status yang dicoba: {batch.status}. Target status: {action === "reject" ? "Rejected" : action === "lock" ? "Locked" : batch.status}.</p>
<AttendanceConflictDetails conflict={conflict} />
</div>}
{failure.status === 409 && <div className="page-actions">
<Link className="button button-secondary" href={access.url(`/attendance/${id}`)}>
Muat versi terbaru
</Link>
<Link className="button button-quiet" href={access.url("/attendance")}>
Kembali tanpa menyimpan
</Link>
</div>}
</Alert>}
<section className="attendance-summary" aria-label="Ringkasan batch">
{[["Total", batch.summary.totalRows], ["Valid", batch.summary.validRows], ["Invalid", batch.summary.invalidRows], ["Duplicate", batch.summary.duplicateRows], ["Warning", batch.summary.warningRows], ["Blocking", batch.summary.blockingIssueCount]].map(([label, value]) => <Card key={label}>
<small>
{label}
</small>
<strong>
{value}
</strong>
</Card>)}
</section>
<Alert tone={readiness.blockers.length ? "warning" : "success"} title="Next action">
{readiness.nextAction}
{readiness.blockers.length > 0 && <ul>
{readiness.blockers.map(item => <li key={item}>
{item}
</li>)}
</ul>}
</Alert>
<div className="detail-grid">
<Card>
<CardHeader title="File metadata aman" />
<dl className="detail-list">
<dt>
Filename
</dt>
<dd className="break-anywhere">
{batch.file?.displayFilename ?? "Belum ada file"}
</dd>
<dt>
MIME
</dt>
<dd>
{batch.file?.mimeType ?? "-"}
</dd>
<dt>
Ukuran
</dt>
<dd>
{batch.file?.sizeBytes ?? 0}
{' '}
byte
</dd>
<dt>
Template
</dt>
<dd>
{batch.templateVersion ?? "Menunggu backend"}
</dd>
</dl>
</Card>
<Card>
<CardHeader title="Duplicate/checksum" />
<StatusBadge tone={batch.duplicates.decision === "Blocking" ? "danger" : "success"}>
{batch.duplicates.decision}
</StatusBadge>
<p>
Within file:
{batch.duplicates.withinFile}
; prior batch:
{batch.duplicates.priorBatch}
.
</p>
<p>
{batch.duplicates.note}
</p>
<small>
Tidak ada checksum production yang dibuat oleh frontend.
</small>
</Card>
</div>
<Card>
<CardHeader title="Mapping preview read-only" />
<TableShell caption="Mapping attendance">
<thead>
<tr>
<th scope="col">
Source
</th>
<th scope="col">
Target
</th>
<th scope="col">
Required
</th>
<th scope="col">
Status
</th>
<th scope="col">
Example aman
</th>
<th scope="col">
Issue
</th>
</tr>
</thead>
<tbody>
{batch.mapping.map(item => <tr key={item.sourceColumn}>
<td>
{item.sourceColumn}
</td>
<td>
{item.targetField}
</td>
<td>
{item.required ? "Ya" : "Tidak"}
</td>
<td>
{item.status}
</td>
<td>
{item.exampleValue}
</td>
<td>
{item.message ?? "-"}
</td>
</tr>)}
</tbody>
</TableShell>
</Card>
<Card>
<CardHeader title="Row validation issues" />
{issues.data && <AttendanceIssueToolbar page={issues.data.page} hasNext={issues.data.hasNextPage} />}
{issues.isPending ? <LoadingState /> : issues.isError ? <DataState kind={normalizeAppError(issues.error).status === 403 ? "denied" : "server"} correlationId={normalizeAppError(issues.error).correlation_id} action={normalizeAppError(issues.error).retryable ? <Button onClick={() => issues.refetch()}>
Coba lagi issue
</Button> : undefined} /> : issues.data.items.length ? <>
<TableShell caption="Issue attendance">
<thead>
<tr>
<th scope="col">
Row
</th>
<th scope="col">
Column
</th>
<th scope="col">
Value aman
</th>
<th scope="col">
Reason
</th>
<th scope="col">
Severity
</th>
<th scope="col">
Suggested action
</th>
</tr>
</thead>
<tbody>
{issues.data.items.map(issue => <tr key={issue.id}>
<td>
{issue.rowNumber}
</td>
<td>
{issue.sourceColumn}
</td>
<td>
{issue.safeValue}
</td>
<td>
{issue.reason}
<small className="table-subtext">
{issue.code}
</small>
</td>
<td>
<StatusBadge tone={issue.severity === "Warning" ? "warning" : "danger"}>
{issue.severity}
</StatusBadge>
</td>
<td>
{issue.suggestedAction ?? "-"}
</td>
</tr>)}
</tbody>
</TableShell>
<div className="project-mobile-list">
{issues.data.items.map(issue => <article key={issue.id}>
<StatusBadge tone="danger">
{issue.severity}
</StatusBadge>
<strong>
Row
{issue.rowNumber}
{' '}
·
{issue.sourceColumn}
</strong>
<span>
{issue.safeValue}
</span>
<small>
{issue.reason}
</small>
</article>)}
</div>
</> : <DataState kind={issueQuery.search || issueQuery.severities?.length ? "zero" : "empty"} title="Tidak ada issue" />}
<Alert tone="info" title="Error report">
Export binary menunggu backend. Placeholder ini tidak membuat signed URL atau file sensitif palsu.
</Alert>
</Card>
<div className="detail-grid">
<Card>
<CardHeader title="Revision history" />
<ol className="audit-list">
{detail.data.revisions.map(revision => <li key={revision.id}>
<strong>
Revision
{revision.revisionNumber}
{' '}
·
{revision.status}
</strong>
<span>
{revision.reason}
{' '}
· 
{' '}
{formatDate(revision.createdAt, true)}
</span>
<small>
{revision.diffSummary}
</small>
</li>)}
</ol>
</Card>
<Card>
<CardHeader title="Activity timeline" />
{activity.isPending ? <LoadingState /> : activity.isError ? <DataState kind={mapActivityError(activity.error).status === 403 ? "denied" : "server"} correlationId={mapActivityError(activity.error).correlation_id} action={mapActivityError(activity.error).retryable ? <Button onClick={() => activity.refetch()}>
Coba lagi activity
</Button> : undefined} /> : activity.data.length ? <ol className="audit-list">
{activity.data.map(event => <li key={event.id}>
<strong>
{event.action}
</strong>
<span>
{event.actorName ?? event.actorUserId}
{' '}
· 
{' '}
{formatDate(event.occurredAt, true)}
</span>
<small>
{event.reason}
{' '}
· 
{' '}
{event.correlationId}
</small>
<p>
{event.summary}
</p>
</li>)}
</ol> : <DataState kind="empty" title="Belum ada activity" />}
</Card>
</div>
<Modal open={Boolean(action)} onClose={() => setAction(undefined)} title={action === "validate" ? "Validasi seluruh batch" : action === "lock" ? "Kunci batch" : "Tolak batch"} description="Mutation menunggu konfirmasi repository dan menggunakan optimistic version." footer={<>
<Button variant="secondary" onClick={() => setAction(undefined)}>
Batal
</Button>
<Button variant={action === "reject" ? "danger" : "primary"} disabled={reason.trim().length < 3 || validate.isPending || lock.isPending || reject.isPending} onClick={() => void commit()}>
Konfirmasi
</Button>
</>}>
<p>
Project:
{batch.projectLabel}
</p>
<p>
Periode:
{batch.period}
</p>
<p>
Valid
{batch.summary.validRows}
; invalid
{batch.summary.invalidRows}
; duplicate
{batch.summary.duplicateRows}
; blocking
{batch.summary.blockingIssueCount}
.
</p>
<p>
Keputusan: seluruh batch, tanpa partial row.
</p>
<Input label="Alasan / attestation" value={reason} onChange={event => setReason(event.target.value)} />
</Modal>
</>; }
