"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui";
export function AttendanceIssueToolbar({ page, hasNext }: { page: number; hasNext: boolean }) {
const router = useRouter();
const pathname = usePathname();
const params = useSearchParams();
const update = (values: Record<string, string | undefined>) => { const next = new URLSearchParams(params); for (const [key, value] of Object.entries(values)) { if (value) next.set(key, value); else next.delete(key); } router.replace(`${pathname}?${next.toString()}`, { scroll: false }); };
useEffect(() => {
  const next = new URLSearchParams(params);
  let changed = false;
  if (!["10", "20", "50"].includes(next.get("issuePageSize") ?? "20")) { next.delete("issuePageSize"); changed = true; }
  if (!["asc", "desc"].includes(next.get("issueDirection") ?? "asc")) { next.delete("issueDirection"); changed = true; }
  if (!["rowNumber", "severity"].includes(next.get("issueSort") ?? "rowNumber")) { next.delete("issueSort"); changed = true; }
  const rawPage = next.get("issuePage");
  if (rawPage && (!Number.isInteger(Number(rawPage)) || Number(rawPage) < 1)) { next.delete("issuePage"); changed = true; }
  if (changed) router.replace(`${pathname}?${next.toString()}`, { scroll: false });
}, [params, pathname, router]);
return <>
<div className="project-filters">
<label>
<span>
Cari issue
</span>
<input aria-label="Cari issue" value={params.get("issueSearch") ?? ""} onChange={event => update({ issueSearch: event.target.value.trim() || undefined, issuePage: undefined })} />
</label>
<label>
<span>
Severity
</span>
<select aria-label="Severity issue" value={params.get("severity") ?? ""} onChange={event => update({ severity: event.target.value || undefined, issuePage: undefined })}>
<option value="">
Semua
</option>
<option>
Error
</option>
<option>
Warning
</option>
<option>
Duplicate
</option>
</select>
</label>
<label>
<span>
Urutkan
</span>
<select aria-label="Urutan issue" value={params.get("issueSort") ?? "rowNumber"} onChange={event => update({ issueSort: event.target.value, issuePage: undefined })}>
<option value="rowNumber">
Nomor row
</option>
<option value="severity">
Severity
</option>
</select>
</label>
<label>
<span>
Arah
</span>
<select aria-label="Arah urutan issue" value={params.get("issueDirection") === "desc" ? "desc" : "asc"} onChange={event => update({ issueDirection: event.target.value, issuePage: undefined })}>
<option value="asc">
Menaik
</option>
<option value="desc">
Menurun
</option>
</select>
</label>
<Button variant="secondary" onClick={() => update({ issueSearch: undefined, severity: undefined, issueSort: undefined, issueDirection: undefined, issuePage: undefined, issuePageSize: undefined })}>
Reset filter
</Button>
</div>
<div className="pagination">
<label>
Ukuran halaman
<select aria-label="Ukuran halaman issue" value={["10", "20", "50"].includes(params.get("issuePageSize") ?? "") ? params.get("issuePageSize") ?? "20" : "20"} onChange={event => update({ issuePageSize: event.target.value, issuePage: undefined })}>
<option>
10
</option>
<option>
20
</option>
<option>
50
</option>
</select>
</label>
<Button variant="secondary" disabled={page <= 1} onClick={() => update({ issuePage: String(page - 1) })}>
Sebelumnya
</Button>
<Button variant="secondary" disabled={!hasNext} onClick={() => update({ issuePage: String(page + 1) })}>
Berikutnya
</Button>
</div>
</>; }
