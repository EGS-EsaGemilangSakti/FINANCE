"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Button, Card, CardHeader, DataState, LoadingState, Select, TableShell } from "@/components/ui";
import { isRequestCancellation } from "@/features/foundation/domain/errors";
import { formatDate, formatRupiah } from "@/lib/formatters";
import type { PayrollBillingRevision, PayrollBillingRunDetail, PayrollRevisionDiff } from "../domain/types";
import { mapPayrollBillingMutationError } from "../domain/mutation-error";
import { usePayrollBillingRevision, usePayrollBillingRevisionDiff, usePayrollBillingRevisions } from "../queries/hooks";

type Pair = { sourceId: string; targetId: string };
const defaultPair = (revisions: readonly PayrollBillingRevision[], currentId: string): Pair => {
  const target = revisions.find((revision) => revision.id === currentId) ?? revisions[0];
  const targetIndex = target ? revisions.findIndex((revision) => revision.id === target.id) : -1;
  const source = revisions[targetIndex + 1] ?? revisions.find((revision) => revision.id !== target?.id);
  return { sourceId: source?.id ?? "", targetId: target?.id ?? "" };
};
const pairIsValid = (pair: Pair, revisions: readonly PayrollBillingRevision[]) => Boolean(pair.sourceId && pair.targetId && pair.sourceId !== pair.targetId && revisions.some((item) => item.id === pair.sourceId) && revisions.some((item) => item.id === pair.targetId));

export function PayrollRevisionWorkspace({ detail, access }: { detail: PayrollBillingRunDetail; access: string }) {
  const initial = defaultPair(detail.revisions, detail.run.currentRevisionId);
  const history = usePayrollBillingRevisions(detail.run.id, access, access !== "none");
  const revisions = history.data ?? detail.revisions;
  const [selection, setSelection] = useState<Pair>(initial);
  const [compared, setCompared] = useState<Pair>(initial);
  const resultRef = useRef<HTMLDivElement>(null);
  const validSelection = pairIsValid(selection, revisions);
  const validCompared = pairIsValid(compared, revisions);
  const source = usePayrollBillingRevision(detail.run.id, selection.sourceId, access, validSelection);
  const target = usePayrollBillingRevision(detail.run.id, selection.targetId, access, validSelection);
  const diff = usePayrollBillingRevisionDiff(detail.run.id, compared.sourceId, compared.targetId, access, validCompared);

  if (access === "none") return <Card><CardHeader title="Revision timeline dan diff" /><DataState kind="denied" title="Revision Workspace tidak diizinkan" /></Card>;
  const compare = () => { if (!validSelection) return; setCompared(selection); requestAnimationFrame(() => resultRef.current?.focus()); };
  const recover = () => { const pair = defaultPair(revisions, detail.run.currentRevisionId); setSelection(pair); setCompared(pair); };

  return <section aria-labelledby="revision-workspace-heading" className="revision-workspace">
    <Card><CardHeader title="Revision timeline dan diff" /><h2 id="revision-workspace-heading" className="sr-only">Revision Workspace</h2>
      {history.isPending && !history.data ? <div role="status" aria-live="polite" aria-label="Memuat revision history"><LoadingState /></div> : history.isError && !isRequestCancellation(history.error) ? <WorkspaceError title="Revision history belum dapat dimuat" error={history.error} access={access} runId={detail.run.id} onRetry={() => void history.refetch()} /> : revisions.length === 0 ? <DataState kind="empty" title="Revision history tidak tersedia" description="Server tidak mengembalikan revision. Detail run utama tetap dapat digunakan; tidak ada revision sintetis yang dibuat." /> : <RevisionTimeline revisions={revisions} currentId={detail.run.currentRevisionId} />}

      {revisions.length < 2 ? <DataState kind="empty" title="Belum ada dua revision untuk dibandingkan" description="Compare tersedia setelah revision historis berikutnya dibuat." /> : <>
        <div className="filter-grid revision-selectors">
          <Select label="Revision sumber" value={selection.sourceId} onChange={(event) => { const sourceId = event.currentTarget.value; setSelection((current) => ({ ...current, sourceId })); }}>{revisions.map((item) => <option key={item.id} value={item.id}>Revision {item.revisionNumber} / {item.status} / {formatDate(item.createdAt, true)}</option>)}</Select>
          <Select label="Revision target" value={selection.targetId} onChange={(event) => { const targetId = event.currentTarget.value; setSelection((current) => ({ ...current, targetId })); }}>{revisions.map((item) => <option key={item.id} value={item.id}>Revision {item.revisionNumber} / {item.status} / {formatDate(item.createdAt, true)}</option>)}</Select>
          <Button disabled={!validSelection} onClick={compare}>Bandingkan revision</Button><Button variant="quiet" onClick={recover}>Kembali ke pasangan current</Button>
        </div>
        {!validSelection && <DataState kind="zero" title={selection.sourceId === selection.targetId ? "Pilih dua revision berbeda" : "Pilihan revision tidak lagi tersedia"} action={<Button variant="secondary" onClick={recover}>Pulihkan pasangan revision</Button>} />}
        {validSelection && <div className="revision-detail-grid"><RevisionDetail label="Revision sumber" revision={source.data} currentId={detail.run.currentRevisionId} pending={source.isPending} error={source.error} onRetry={() => void source.refetch()} access={access} runId={detail.run.id} /><RevisionDetail label="Revision target" revision={target.data} currentId={detail.run.currentRevisionId} pending={target.isPending} error={target.error} onRetry={() => void target.refetch()} access={access} runId={detail.run.id} /></div>}
        <div ref={resultRef} tabIndex={-1} aria-label="Hasil perbandingan revision" className="revision-result">{!validCompared ? <DataState kind="zero" title="Pasangan revision belum lengkap" /> : diff.isPending ? <div role="status" aria-live="polite" aria-label="Memuat revision diff"><LoadingState /></div> : diff.isError ? isRequestCancellation(diff.error) ? <div role="status">Perbandingan dibatalkan. Pilih pasangan lalu coba kembali.</div> : <WorkspaceError title="Diff belum dapat dimuat" error={diff.error} access={access} runId={detail.run.id} onRetry={() => void diff.refetch()} recovery={recover} /> : diff.data ? <RevisionDiffView diff={diff.data} /> : null}</div>
      </>}
    </Card>
  </section>;
}

function RevisionTimeline({ revisions, currentId }: { revisions: readonly PayrollBillingRevision[]; currentId: string }) {
  return <ol className="audit-list revision-timeline" aria-label="Revision history">{revisions.map((revision) => <li key={revision.id}><strong className="break-all">Revision {revision.revisionNumber} / {revision.id} / {revision.id === currentId ? "Current" : "Historical read-only"}</strong><span>{revision.status} / {formatRupiah(revision.snapshot.summary.grandTotal)} / {revision.snapshot.reconciliation.reconciled ? "Reconciled" : "Tidak reconciled"}</span><small>{revision.actorUserId} / {formatDate(revision.snapshot.calculatedAt, true)} / {revision.reason} / Attendance R{revision.snapshot.source.attendanceRevision} / {revision.snapshot.source.rateVersionLabel} / {revision.exceptionCount} exception</small></li>)}</ol>;
}

function RevisionDetail({ label, revision, currentId, pending, error, onRetry, access, runId }: { label: string; revision?: PayrollBillingRevision; currentId: string; pending: boolean; error: Error | null; onRetry: () => void; access: string; runId: string }) {
  if (pending) return <Card><CardHeader title={label} /><div role="status" aria-label={`Memuat ${label}`}><LoadingState /></div></Card>;
  if (error) return isRequestCancellation(error) ? <Card><CardHeader title={label} /><p role="status">Permintaan revision dibatalkan.</p></Card> : <Card><CardHeader title={label} /><WorkspaceError title={`${label} belum dapat dimuat`} error={error} access={access} runId={runId} onRetry={onRetry} /></Card>;
  if (!revision) return <Card><CardHeader title={label} /><DataState kind="empty" title="Revision tidak tersedia" /></Card>;
  const snapshot = revision.snapshot;
  return <Card><CardHeader title={label} /><dl className="detail-list revision-detail"><dt>Identity</dt><dd className="break-all">Revision {revision.revisionNumber} / {revision.id}</dd><dt>Marker</dt><dd>{revision.id === currentId ? "Current" : "Historical read-only"}</dd><dt>Status</dt><dd>{revision.status}</dd><dt>Actor / timestamp</dt><dd className="break-all">{revision.actorUserId} / {formatDate(revision.createdAt, true)}</dd><dt>Reason</dt><dd>{revision.reason}</dd><dt>Attendance</dt><dd className="break-all">{snapshot.source.attendanceBatchId} / R{snapshot.source.attendanceRevision}</dd><dt>Rate Version</dt><dd className="break-all">{snapshot.source.rateVersionLabel}</dd><dt>Grand total</dt><dd className="amount-wrap">{formatRupiah(snapshot.summary.grandTotal)}</dd><dt>Exception</dt><dd>{revision.exceptionCount}</dd><dt>Reconciliation</dt><dd>{snapshot.reconciliation.reconciled ? "Reconciled" : "Tidak reconciled"} / variance {snapshot.reconciliation.variance}</dd></dl></Card>;
}

function WorkspaceError({ title, error, onRetry, recovery, access, runId }: { title: string; error: Error; onRetry: () => void; recovery?: () => void; access: string; runId: string }) {
  const mapped = mapPayrollBillingMutationError(error);
  return <div role="alert" aria-live="assertive" className="workspace-error"><DataState kind={mapped.safeCode.includes("FORBIDDEN") ? "denied" : "server"} title={title} description={`${mapped.safeMessage} Kode: ${mapped.safeCode}`} correlationId={mapped.correlationId || undefined} action={<div className="responsive-actions">{mapped.retryable && <Button variant="secondary" onClick={onRetry}>Coba lagi</Button>}{recovery && <Button variant="secondary" onClick={recovery}>Pulihkan pasangan</Button>}<Link className="button button-quiet" href={`/payroll-billing/${encodeURIComponent(runId)}?access=${encodeURIComponent(access)}`}>Kembali ke detail current</Link></div>} /></div>;
}

function RevisionDiffView({ diff }: { diff: PayrollRevisionDiff }) {
  const noChanges = diff.addedLines.length === 0 && diff.removedLines.length === 0 && diff.changedLines.length === 0;
  return <section aria-labelledby="revision-diff-heading"><h3 id="revision-diff-heading">Hasil perbandingan revision</h3><dl className="detail-list"><dt>Source / target</dt><dd className="break-all">Revision {diff.source.number} ({diff.source.id}, {diff.source.status}) / Revision {diff.target.number} ({diff.target.id}, {diff.target.status})</dd><dt>Grand total before / after</dt><dd className="amount-wrap">{formatRupiah(diff.summary.before)} / {formatRupiah(diff.summary.after)}</dd><dt>Absolute delta</dt><dd className="amount-wrap">{formatRupiah(diff.summary.absoluteDelta)}</dd><dt>Percentage delta</dt><dd>{diff.summary.denominatorZero ? "Tidak dapat dihitung: denominator nol" : `${diff.summary.percentageDelta}%`}</dd></dl>{noChanges && <DataState kind="empty" title="Tidak ada perubahan" description="Added 0, Removed 0, Changed 0. Summary before dan after tetap authoritative." />}
    <TableShell caption="Changed lines antar revision"><thead><tr><th>Line</th><th>Fields</th><th>Quantity before / after</th><th>Rate before / after</th><th>Adjustment</th><th>Withholding</th><th>Final before / after</th><th>Components</th></tr></thead><tbody>{diff.changedLines.map((line) => <tr key={line.lineId}><td className="break-all">{line.lineId}</td><td>{line.changedFields.join(", ")}</td><td>{line.before.quantity} / {line.after.quantity}</td><td>{formatRupiah(line.before.unitRate)} / {formatRupiah(line.after.unitRate)}</td><td>{formatRupiah(line.before.adjustment)} / {formatRupiah(line.after.adjustment)}</td><td>{formatRupiah(line.before.withholding)} / {formatRupiah(line.after.withholding)}</td><td>{formatRupiah(line.before.finalAmount)} / {formatRupiah(line.after.finalAmount)}</td><td>{line.components.map((component) => `${component.kind}: ${component.code}`).join(", ") || "Tidak berubah"}</td></tr>)}</tbody></TableShell>
    <div className="mobile-card-list revision-diff-mobile" aria-label="Changed lines mobile">{diff.changedLines.map((line) => <article key={line.lineId}><strong className="break-all">Changed / {line.lineId}</strong><dl className="detail-list"><dt>Fields</dt><dd>{line.changedFields.join(", ")}</dd><dt>Quantity</dt><dd>{line.before.quantity} / {line.after.quantity}</dd><dt>Rate</dt><dd>{formatRupiah(line.before.unitRate)} / {formatRupiah(line.after.unitRate)}</dd><dt>Adjustment</dt><dd>{formatRupiah(line.before.adjustment)} / {formatRupiah(line.after.adjustment)}</dd><dt>Withholding</dt><dd>{formatRupiah(line.before.withholding)} / {formatRupiah(line.after.withholding)}</dd><dt>Final</dt><dd>{formatRupiah(line.before.finalAmount)} / {formatRupiah(line.after.finalAmount)}</dd><dt>Components</dt><dd>{line.components.map((component) => `${component.kind}: ${component.code}`).join(", ") || "Tidak berubah"}</dd></dl></article>)}</div>
    <div className="revision-counts"><p>Added lines: {diff.addedLines.length}</p><p>Removed lines: {diff.removedLines.length}</p><p>Changed lines: {diff.changedLines.length}</p>{diff.sourceChanges.map((change) => <p key={change.field}>{change.field}: {change.before} / {change.after}</p>)}{diff.issues.map((issue) => <p key={issue.code}><strong>{issue.code}</strong>: {issue.message}</p>)}</div>
  </section>;
}
