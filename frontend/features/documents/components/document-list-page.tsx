"use client";

import { faArrowDown, faArrowUp, faPlus, faRotate } from "@fortawesome/free-solid-svg-icons";
import { columnVisibilityFeature, createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppIcon, Badge, Button, Card, CardHeader, DataState, LoadingState, PageHeader, StatusBadge, TableShell } from "@/components/ui";
import { formatBytes, formatDate } from "@/lib/formatters";
import type { DocumentListItem } from "../domain/types";
import { normalizeDocumentListQuery } from "../domain/validation";
import { useDocumentAccess } from "../permissions/demo-access";
import { useDocumentList } from "../queries/hooks";

const features = tableFeatures({ columnVisibilityFeature });
const helper = createColumnHelper<typeof features, DocumentListItem>();
const sortable = new Set(["category", "title", "status", "updatedAt"]);

export function DocumentListPage({ projectId }: { projectId: string }) {
  const access = useDocumentAccess();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const query = useMemo(() => normalizeDocumentListQuery({
    search: params.get("search") ?? undefined,
    categories: params.get("category") ? [params.get("category") as DocumentListItem["category"]] : [],
    statuses: params.get("status") ? [params.get("status") as DocumentListItem["status"]] : [],
    processingStatuses: params.get("processing") ? [params.get("processing") as DocumentListItem["latestProcessingStatus"]] : [],
    completeness: (params.get("completeness") as "all" | "clean" | "missing-clean") ?? "all",
    sort: (params.get("sort") as "category" | "title" | "status" | "updatedAt") ?? undefined,
    direction: params.get("direction") === "asc" ? "asc" : "desc",
    page: Number(params.get("page") || 1),
    pageSize: Number(params.get("pageSize") || 20),
  }), [params]);
  const [search, setSearch] = useState(query.search);
  const result = useDocumentList("Project", projectId, query, access.canView);
  const update = useCallback((changes: Readonly<Record<string, string | undefined>>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.set("access", access.access);
    router.replace(`${pathname}?${next}`, { scroll: false });
  }, [access.access, params, pathname, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim().toLocaleLowerCase("id-ID") !== query.search) update({ search: search || undefined, page: undefined });
    }, 350);
    return () => clearTimeout(timer);
  }, [query.search, search, update]);

  const reset = () => { setSearch(""); router.replace(access.url(pathname)); };
  const columns = useMemo(() => helper.columns([
    helper.accessor("category", { header: "Kategori" }),
    helper.accessor("title", { header: "Judul" }),
    helper.accessor("status", { header: "Status", cell: ({ getValue }) => <StatusBadge tone={getValue() === "Active" ? "success" : "neutral"}>{getValue()}</StatusBadge> }),
    helper.accessor("owner", { header: "Owner", cell: ({ getValue }) => `${getValue().objectType} · ${getValue().label}` }),
    helper.accessor("currentVersionNumber", { header: "Current", cell: ({ getValue }) => getValue() ? `v${getValue()}` : "Belum Clean" }),
    helper.accessor("currentFileName", { header: "File", cell: ({ row }) => <>{row.original.currentFileName ?? "-"}<small className="table-subtext">{row.original.currentMimeType ?? "-"} · {row.original.currentSizeBytes ? formatBytes(row.original.currentSizeBytes) : "-"}</small></> }),
    helper.accessor("latestProcessingStatus", { header: "Processing", cell: ({ getValue }) => <StatusBadge tone={getValue() === "Clean" ? "success" : getValue() === "Rejected" || getValue() === "Failed" ? "danger" : "warning"}>{getValue()}</StatusBadge> }),
    helper.accessor("uploadedByName", { header: "Uploader" }),
    helper.accessor("updatedAt", { header: "Diperbarui", cell: ({ getValue }) => formatDate(getValue(), true) }),
    helper.display({ id: "actions", header: "Tindakan", cell: ({ row }) => <Link href={access.url(`/documents/${row.original.id}`)}>Buka detail</Link> }),
  ]), [access]);
  const table = useTable({ features, columns, data: result.data?.items ?? [], getRowId: (row) => row.id });

  if (!access.canView) return <DataState kind="denied" title="Akses dokumen dibatasi" description="Metadata filename dan owner tidak dimuat." />;
  if (result.isPending) return <LoadingState />;
  if (result.isError) return <DataState kind="server" correlationId={result.error.correlation_id} action={<Button onClick={() => result.refetch()}>Coba lagi</Button>} />;
  const data = result.data;
  const totalPages = data.total ? Math.ceil(data.total / data.pageSize) : 0;
  const filtered = Boolean(query.search || query.categories.length || query.statuses.length || query.processingStatuses.length || query.completeness !== "all");

  return <>
    <PageHeader eyebrow="Document Management" title={`Dokumen · ${data.owner.label}`} description="Version history, validation, scanning simulation, dan audit metadata." meta={<Badge tone="warning">Data demo · binary tidak disimpan</Badge>} actions={<><Link className="button button-secondary" href={access.url(`/projects/${projectId}`)}>Project Detail</Link>{access.canManage && <Link className="button button-primary" href={access.url(`${pathname}/new`)}><AppIcon icon={faPlus} />Tambah dokumen</Link>}</>} />
    <div className="metric-grid"><Card><CardHeader title="Total dokumen" /><strong>{data.summary.total}</strong></Card><Card><CardHeader title="Required lengkap" /><strong>{data.summary.requiredComplete}</strong></Card><Card><CardHeader title="Pending/scanning" /><strong>{data.summary.pendingOrScanning}</strong></Card><Card><CardHeader title="Rejected/failed" /><strong>{data.summary.rejectedOrFailed}</strong><span>{data.summary.withoutCurrentClean} tanpa current Clean</span></Card></div>
    <Card>
      <div className="project-filters">
        <label><span>Cari dokumen</span><input value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <label><span>Kategori</span><select value={query.categories[0] ?? ""} onChange={(event) => update({ category: event.target.value || undefined, page: undefined })}><option value="">Semua</option><option>Project Brief</option><option>Contract</option><option>Rate Support</option><option>Other</option></select></label>
        <label><span>Status dokumen</span><select value={query.statuses[0] ?? ""} onChange={(event) => update({ status: event.target.value || undefined, page: undefined })}><option value="">Semua</option><option>Active</option><option>Archived</option></select></label>
        <label><span>Processing</span><select value={query.processingStatuses[0] ?? ""} onChange={(event) => update({ processing: event.target.value || undefined, page: undefined })}><option value="">Semua</option><option>Pending</option><option>Scanning</option><option>Clean</option><option>Rejected</option><option>Failed</option></select></label>
        <label><span>Current completeness</span><select value={query.completeness} onChange={(event) => update({ completeness: event.target.value === "all" ? undefined : event.target.value, page: undefined })}><option value="all">Semua</option><option value="clean">Ada current Clean</option><option value="missing-clean">Belum ada current Clean</option></select></label>
      </div>
      <div className="table-toolbar"><span>{data.total} hasil</span><label>Ukuran halaman <select value={query.pageSize} onChange={(event) => update({ pageSize: event.target.value, page: undefined })}><option>10</option><option>20</option><option>50</option></select></label><details><summary>Kolom</summary>{table.getAllLeafColumns().filter((column) => column.id !== "title").map((column) => <label key={column.id}><input type="checkbox" checked={column.getIsVisible()} onChange={column.getToggleVisibilityHandler()} />{column.id}</label>)}</details><Button variant="secondary" leadingIcon={<AppIcon icon={faRotate} />} onClick={reset}>Reset filter</Button></div>
      {data.items.length === 0 ? <DataState kind={filtered ? "zero" : "empty"} action={filtered ? <Button onClick={reset}>Reset filter</Button> : undefined} /> : <><TableShell caption="Daftar dokumen project"><thead>{table.getHeaderGroups().map((group) => <tr key={group.id}>{group.headers.map((header) => <th key={header.id}>{sortable.has(header.column.id) ? <button className="sort-button" aria-label={`Urutkan ${String(header.column.columnDef.header)} ${query.sort === header.column.id && query.direction === "asc" ? "menurun" : "menaik"}`} onClick={() => update({ sort: header.column.id, direction: query.sort === header.column.id && query.direction === "asc" ? "desc" : "asc", page: undefined })}>{header.isPlaceholder ? null : <table.FlexRender header={header} />}<AppIcon icon={query.sort === header.column.id && query.direction === "asc" ? faArrowUp : faArrowDown} /></button> : header.isPlaceholder ? null : <table.FlexRender header={header} />}</th>)}</tr>)}</thead><tbody>{table.getRowModel().rows.map((row) => <tr key={row.id}>{row.getVisibleCells().map((cell) => <td key={cell.id}><table.FlexRender cell={cell} /></td>)}</tr>)}</tbody></TableShell><div className="project-mobile-list">{data.items.map((item) => <article key={item.id}><StatusBadge tone={item.latestProcessingStatus === "Clean" ? "success" : item.latestProcessingStatus === "Failed" || item.latestProcessingStatus === "Rejected" ? "danger" : "warning"}>{item.latestProcessingStatus}</StatusBadge><strong>{item.title}</strong><small>{item.category} · {item.currentVersionNumber ? `v${item.currentVersionNumber}` : "Belum Clean"}</small><span>{item.currentFileName ?? "Belum ada current file"}</span><Link href={access.url(`/documents/${item.id}`)}>Buka detail</Link></article>)}</div></>}
      <div className="pagination"><Button variant="secondary" disabled={query.page <= 1} onClick={() => update({ page: String(query.page - 1) })}>Sebelumnya</Button><span>Halaman {data.total ? query.page : 0} dari {totalPages}</span><Button variant="secondary" disabled={!data.hasNextPage} onClick={() => update({ page: String(query.page + 1) })}>Berikutnya</Button></div>
    </Card>
  </>;
}
