"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Alert, Button, DataState } from "@/components/ui";
import type { AccessMutationErrorView } from "../domain/mutation-error";

export interface ConflictRecovery { reload: string; back: string; }
export function AccessMutationError({ error, retry, pending, recovery }: { error: AccessMutationErrorView; retry?: () => void; pending?: boolean; recovery?: ConflictRecovery }) {
  const pathname = usePathname(), params = useSearchParams(), access = params.get("access") === "view" || params.get("access") === "none" ? params.get("access")! : "manage";
  const withPersona = (path: string) => `${path}?access=${access}`;
  const inferred = recovery ?? { reload: withPersona(pathname), back: withPersona(pathname.endsWith("/edit") ? pathname.slice(0, -5) : pathname.replace(/\/[^/]+$/, "")) };
  if (error.conflict) return <AccessConflictState error={error} recovery={inferred} />;
  return <Alert tone="danger" title={`${error.code}: ${error.message}`}><ul>{error.globalErrors.map(message => <li key={message}>{message}</li>)}</ul>{error.sod?.findings.map(finding => <div key={finding.ruleId}><strong>{finding.ruleId} · {finding.severity}</strong><p>{finding.permissionKeys.join(" + ")}</p><p>{finding.explanation}</p><p>{finding.guidance}</p><p>Blocking: {finding.blocking ? "ya" : "tidak"}.</p></div>)}<small>ID korelasi: {error.correlationId}</small>{error.retryable && retry && <div><Button variant="secondary" onClick={retry} disabled={pending}>Coba lagi</Button></div>}</Alert>;
}

export function AccessConflictState({ error, recovery }: { error: AccessMutationErrorView; recovery: ConflictRecovery }) {
  const conflict = error.conflict;
  if (!conflict) return null;
  const status = conflict.currentStatus && conflict.targetStatus ? ` Status terbaru ${conflict.currentStatus}; target ${conflict.targetStatus}.` : "";
  return <DataState kind="conflict" title="Data telah berubah" description={`Versi Anda ${conflict.userVersion}; versi terbaru ${conflict.latestVersion}.${status} ${conflict.diffs.map(diff => `${diff.label}: ${diff.before} → ${diff.after}`).join("; ")}`} correlationId={error.correlationId} action={<div className="page-actions"><Link className="button button-secondary" href={recovery.reload}>Muat versi terbaru</Link><Link className="button button-quiet" href={recovery.back}>Kembali tanpa menyimpan</Link></div>} />;
}
