"use client";
import Link from "next/link";
import { useState } from "react";
import { Alert,Badge,Card,CardHeader,DataState,LoadingState,PageHeader,StatusBadge,TableShell } from "@/components/ui";
import { formatDate,formatRupiah } from "@/lib/formatters";
import type { RateDiffKind } from "../domain/types";
import { useRateAccess } from "../permissions/demo-access";
import { useRateComparison } from "../queries/hooks";
const labels:Record<RateDiffKind,string>={Added:"Ditambahkan",Changed:"Berubah",Removed:"Dihapus"};
const period=(value:{effectiveFrom:string;effectiveTo?:string})=>`${formatDate(value.effectiveFrom)} - ${value.effectiveTo?formatDate(value.effectiveTo):"seterusnya"}`;
export function RateComparePage({projectId,rateVersionId}:{projectId:string;rateVersionId:string}){
 const access=useRateAccess(),query=useRateComparison(projectId,rateVersionId,undefined,access.canView),[filter,setFilter]=useState<"All"|RateDiffKind>("All"),base=`/projects/${projectId}/rates`;
 if(!access.canView)return <DataState kind="denied" title="Akses comparison dibatasi"/>;
 if(query.isPending)return <LoadingState/>;
 if(query.isError)return <DataState kind="server" correlationId={query.error.correlation_id}/>;
 const comparison=query.data,rows=comparison.rows.filter((item)=>filter==="All"||item.kind===filter),value=(raw:string|undefined,type:string)=>raw?(type==="Fixed Amount"?formatRupiah(raw):raw):"-";
 return <><PageHeader eyebrow={`${comparison.target.projectId} · Compare before-after`} title={`${comparison.source?`v${comparison.source.versionNumber}`:"Tanpa source"} → v${comparison.target.versionNumber}`} description="Perubahan rate per scope; formula ditampilkan sebagai metadata dan tidak dieksekusi di frontend." meta={<Badge tone="warning">Data demo</Badge>} actions={<Link className="button button-secondary" href={access.url(`${base}/${rateVersionId}`)}>Kembali ke versi</Link>}/>
 <Alert tone="info" title="Historical immutability">Perbandingan tidak mengubah snapshot transaksi final. Persentase dengan denominator nol ditampilkan sebagai “Tidak dapat dihitung”.</Alert>
 <div className="detail-grid"><Card><CardHeader title="Versi sumber"/>{comparison.source?<dl className="detail-list"><dt>Versi/status</dt><dd>v{comparison.source.versionNumber} · {comparison.source.status}</dd><dt>Periode efektif</dt><dd>{period(comparison.source)}</dd></dl>:<DataState kind="empty" title="Tidak ada versi pembanding" description="Target tidak mempunyai source version resmi."/>}</Card><Card><CardHeader title="Versi target"/><dl className="detail-list"><dt>Versi/status</dt><dd>v{comparison.target.versionNumber} · {comparison.target.status}</dd><dt>Periode efektif</dt><dd>{period(comparison.target)}</dd></dl></Card></div>
 <Card><CardHeader title="Filter perubahan"/><div className="segmented-control">{(["All","Added","Changed","Removed"] as const).map((item)=><button key={item} aria-pressed={filter===item} onClick={()=>setFilter(item)}>{item==="All"?"Semua":labels[item]}</button>)}</div><p>{comparison.unchangedCount} scope tidak berubah.</p>
 <TableShell caption="Perbandingan rate sebelum dan sesudah"><thead><tr><th>Status perubahan</th><th>Service/scope</th><th>Rate type/unit</th><th>Sebelum</th><th>Sesudah</th><th>Perubahan</th></tr></thead><tbody>{rows.map((row)=><tr key={row.key}><td><StatusBadge tone={row.kind==="Added"?"success":row.kind==="Removed"?"danger":"warning"}>{labels[row.kind]}</StatusBadge></td><td>{row.serviceName}<small className="table-subtext">{row.scope}</small></td><td>{row.rateType} · {row.unit}</td><td>{value(row.previousValue,row.rateType)}</td><td>{value(row.newValue,row.rateType)}</td><td>{row.absoluteChange?`${formatRupiah(row.absoluteChange)} · ${row.percentageChange?`${row.percentageChange}%`:"Tidak dapat dihitung"}`:"-"}</td></tr>)}</tbody></TableShell>
 <div className="project-mobile-list">{rows.map((row)=><article key={row.key}><StatusBadge tone={row.kind==="Added"?"success":row.kind==="Removed"?"danger":"warning"}>{labels[row.kind]}</StatusBadge><strong>{row.serviceName}</strong><small>{row.scope} · {row.rateType} · {row.unit}</small><span>{value(row.previousValue,row.rateType)} → {value(row.newValue,row.rateType)}</span><small>Sumber {comparison.source?period(comparison.source):"tidak tersedia"} · Target {period(comparison.target)}</small></article>)}</div></Card></>;
}
