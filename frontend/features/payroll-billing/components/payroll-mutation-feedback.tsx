"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Alert, Button } from "@/components/ui";
import type { PayrollMutationErrorView } from "../domain/mutation-error";

export function PayrollMutationFeedback({ action, error, runId, access, onBack, onRetry, retryPending = false }: {
  action: string; error?: PayrollMutationErrorView; runId: string; access: string; onBack: () => void; onRetry?: () => void; retryPending?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (error?.conflict) ref.current?.focus(); }, [error]);
  if (!error || error.cancelled) return null;
  if (error.conflict) {
    const conflict = error.conflict;
    return <div ref={ref} tabIndex={-1} role="alert" aria-label={`Konflik ${action}`} aria-live="assertive" className="conflict-panel">
      <h3>Konflik saat {action}</h3><p>{error.safeMessage}</p><dl className="detail-list">
        <dt>Run ID</dt><dd>{runId}</dd>
        <dt>Attempted aggregate version</dt><dd>{conflict.attemptedVersion ?? "—"}</dd><dt>Latest aggregate version</dt><dd>{conflict.latestVersion ?? "—"}</dd>
        <dt>Attempted revision</dt><dd>{conflict.attemptedRevisionId ?? "—"} v{conflict.attemptedRevisionVersion ?? "—"}</dd><dt>Latest revision</dt><dd>{conflict.latestRevisionId ?? "—"} v{conflict.latestRevisionVersion ?? "—"}</dd>
        <dt>Attempted status</dt><dd>{conflict.attemptedStatus ?? "—"}</dd><dt>Latest status</dt><dd>{conflict.latestStatus ?? "—"}</dd>
        <dt>Error code</dt><dd>{error.safeCode}</dd>{error.correlationId && <><dt>ID korelasi</dt><dd className="break-all">{error.correlationId}</dd></>}
      </dl><p>Ringkasan versi: {conflict.attemptedVersion ?? "—"} &rarr; {conflict.latestVersion ?? "—"}.</p>{conflict.diff && <p>Perubahan aman: Revision {conflict.diff.source.id} &rarr; {conflict.diff.target.id}; total {conflict.diff.summary.before} &rarr; {conflict.diff.summary.after}.</p>}
      <p>State authoritative telah berubah. Tidak tersedia force overwrite atau retry otomatis.</p>
      <Link href={`/payroll-billing/${encodeURIComponent(runId)}?access=${encodeURIComponent(access)}`}>Buka detail terbaru</Link><Button variant="secondary" onClick={onBack}>Kembali ke form</Button>
    </div>;
  }
  return <Alert tone="danger" title={`${action} belum berhasil`}><p>{error.safeMessage}</p>{error.globalErrors.filter((message) => message !== error.safeMessage).map((message) => <p key={message}>{message}</p>)}{error.readinessIssues.map((message) => <p key={message}>{message}</p>)}{error.referenceIssues.map((issue) => <p key={`${issue.code}-${issue.field}`}>{issue.explanation} {issue.suggestedAction}</p>)}{error.reconciliationIssue && <p>{error.reconciliationIssue}</p>}<p>Kode: {error.safeCode}</p>{error.correlationId && <code>ID korelasi: {error.correlationId}</code>}{error.retryable && onRetry && <Button variant="secondary" disabled={retryPending} onClick={onRetry}>{retryPending ? "Mencoba lagi…" : "Coba lagi"}</Button>}</Alert>;
}
