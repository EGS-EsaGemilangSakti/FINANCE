"use client";

import { faArrowDown,faArrowUp,faPlus,faRotate } from "@fortawesome/free-solid-svg-icons";
import { createColumnHelper,tableFeatures,useTable } from "@tanstack/react-table";
import Link from "next/link";
import { usePathname,useRouter,useSearchParams } from "next/navigation";
import { useCallback,useEffect,useMemo,useState } from "react";
import { Alert,AppIcon,Badge,Button,Card,CardHeader,DataState,LoadingState,PageHeader,StatusBadge,TableShell } from "@/components/ui";
import { formatDate } from "@/lib/formatters";
import { normalizeRateListQuery } from "../domain/logic";
import type { RateVersionListItem } from "../domain/types";
import { useRateAccess } from "../permissions/demo-access";
import { useRateList } from "../queries/hooks";

const features=tableFeatures({});
const helper=createColumnHelper<typeof features,RateVersionListItem>();
const sortable=new Set(["versionNumber","status","effectiveFrom","createdAt"]);

export function RateListPage({projectId}:{projectId:string}){
 const access=useRateAccess(),params=useSearchParams(),router=useRouter(),pathname=usePathname();
 const query=useMemo(()=>normalizeRateListQuery({search:params.get("search")??undefined,statuses:params.get("status")?[params.get("status") as RateVersionListItem["status"]]:[],effectiveStates:params.get("state")?[params.get("state") as RateVersionListItem["effectiveState"]]:[],sort:(params.get("sort") as "versionNumber"|"status"|"effectiveFrom"|"createdAt")??undefined,direction:params.get("direction")==="asc"?"asc":"desc",page:Number(params.get("page")||1),pageSize:Number(params.get("pageSize")||20)}),[params]);
 const [search,setSearch]=useState(query.search);
 const rates=useRateList(projectId,query,access.canView);
 const update=useCallback((changes:Readonly<Record<string,string|undefined>>)=>{const next=new URLSearchParams(params);for(const [key,value] of Object.entries(changes)){if(value)next.set(key,value);else next.delete(key);}next.set("access",access.access);router.replace(`${pathname}?${next}`,{scroll:false});},[access.access,params,pathname,router]);
 useEffect(()=>{const timer=setTimeout(()=>{if(search.trim().toLocaleLowerCase("id-ID")!==query.search)update({search:search||undefined,page:undefined});},350);return()=>clearTimeout(timer);},[query.search,search,update]);
 const reset=()=>{setSearch("");router.replace(access.url(pathname),{scroll:false});};
 const columns=useMemo(()=>helper.columns([
  helper.accessor("versionNumber",{header:"Versi",cell:({row})=><Link href={access.url(`${pathname}/${row.original.id}`)}>v{row.original.versionNumber}</Link>}),
  helper.accessor("status",{header:"Status",cell:({getValue})=><StatusBadge tone={getValue()==="Active"?"success":getValue()==="Draft"?"info":"neutral"}>{getValue()}</StatusBadge>}),
  helper.accessor("effectiveState",{header:"Posisi waktu",cell:({getValue})=><Badge tone={getValue()==="Current"?"success":getValue()==="Future"?"info":"neutral"}>{getValue()}</Badge>}),
  helper.accessor("effectiveFrom",{header:"Periode efektif",cell:({row})=>`${formatDate(row.original.effectiveFrom)} - ${row.original.effectiveTo?formatDate(row.original.effectiveTo):"seterusnya"}`}),
  helper.accessor("createdAt",{header:"Dibuat",cell:({getValue})=>formatDate(getValue(),true)}),
  helper.accessor("lineCount",{header:"Rate line"}),helper.accessor("reason",{header:"Alasan"}),
  helper.display({id:"actions",header:"Tindakan",cell:({row})=><div className="table-actions"><Link href={access.url(`${pathname}/${row.original.id}`)}>Lihat</Link><Link href={access.url(`${pathname}/${row.original.id}/compare`)}>Bandingkan</Link>{access.canManage&&row.original.status==="Draft"&&<Link href={access.url(`${pathname}/${row.original.id}/edit`)}>Edit</Link>}</div>})
 ]),[access,pathname]);
 const table=useTable({features,columns,data:rates.data?.items??[],getRowId:(row)=>row.id});
 if(!access.canView)return <DataState kind="denied" title="Akses rate dibatasi" description="Persona ini tidak memuat metadata finansial rate."/>;
 if(rates.isPending)return <LoadingState/>;
 if(rates.isError)return <DataState kind="server" correlationId={rates.error.correlation_id} action={<Button onClick={()=>rates.refetch()}>Coba lagi</Button>}/>;
 const data=rates.data,filtered=Boolean(query.search||query.statuses.length||query.effectiveStates.length),totalPages=data.total===0?0:Math.ceil(data.total/data.pageSize);
 return <><PageHeader eyebrow={`${data.context.projectCode} · ${data.context.sphNumber}`} title={`Rate · ${data.context.projectName}`} description={`${data.context.customerName} · Kontrak ${formatDate(data.context.contractStart)} - ${formatDate(data.context.contractEnd)}`} meta={<><StatusBadge tone={data.context.projectStatus==="Active"?"success":"warning"}>{data.context.projectStatus}</StatusBadge><Badge tone="warning">Data demo</Badge></>} actions={<><Link className="button button-secondary" href={access.url(`/projects/${projectId}`)}>Project Detail</Link>{access.canManage&&<Link className="button button-primary" href={access.url(`${pathname}/new`)}><AppIcon icon={faPlus}/>Buat versi baru</Link>}</>}/>
 <Alert tone="info" title="Snapshot historis immutable">Versi rate baru hanya berlaku pada transaksi baru sesuai effective date dan tidak menulis ulang transaksi final.</Alert>
 <div className="metric-grid"><Card><CardHeader title="Rate berlaku"/><strong>{data.summary.current?`v${data.summary.current.versionNumber}`:"Belum ada"}</strong><span>{data.summary.current?formatDate(data.summary.current.effectiveFrom):"-"}</span></Card><Card><CardHeader title="Future version"/><strong>{data.summary.futureCount}</strong></Card><Card><CardHeader title="Historical version"/><strong>{data.summary.historicalCount}</strong></Card><Card><CardHeader title="Readiness"/><strong>{data.summary.draftNeedsReviewCount?`${data.summary.draftNeedsReviewCount} Draft perlu diperiksa`:"Tidak ada blocker Draft"}</strong></Card></div>
 <Card><CardHeader title="Timeline effective version" description="Seluruh histori project; tidak berubah akibat filter atau pagination."/><ol className="rate-timeline">{data.timeline.map((item)=><li key={item.id}><StatusBadge tone={item.status==="Active"?"success":item.status==="Draft"?"info":"neutral"}>{item.status}</StatusBadge><strong>v{item.versionNumber} · {item.effectiveState}</strong><span>{formatDate(item.effectiveFrom)} - {item.effectiveTo?formatDate(item.effectiveTo):"seterusnya"}</span><small>{item.actorName} · {item.reason}</small></li>)}</ol></Card>
 <Card><div className="project-filters"><label><span>Cari versi/alasan</span><input value={search} onChange={(event)=>setSearch(event.target.value)}/></label><label><span>Status</span><select value={query.statuses[0]??""} onChange={(event)=>update({status:event.target.value||undefined,page:undefined})}><option value="">Semua</option><option>Draft</option><option>Active</option><option>Superseded</option><option>Cancelled</option></select></label><label><span>Posisi efektif</span><select value={query.effectiveStates[0]??""} onChange={(event)=>update({state:event.target.value||undefined,page:undefined})}><option value="">Semua</option><option>Current</option><option>Future</option><option>Historical</option></select></label></div>
 <div className="table-toolbar"><span>{data.total} hasil</span><label>Ukuran halaman <select value={query.pageSize} onChange={(event)=>update({pageSize:event.target.value,page:undefined})}><option>10</option><option>20</option><option>50</option></select></label><Button variant="secondary" leadingIcon={<AppIcon icon={faRotate}/>} onClick={reset}>Reset filter</Button></div>
 {data.items.length===0?<DataState kind={filtered?"zero":"empty"} action={filtered?<Button onClick={reset}>Reset filter</Button>:undefined}/>:<><TableShell caption="Daftar versi rate project"><thead>{table.getHeaderGroups().map((group)=><tr key={group.id}>{group.headers.map((header)=><th key={header.id}>{sortable.has(header.column.id)?<button className="sort-button" aria-label={`Urutkan ${String(header.column.columnDef.header)} ${query.sort===header.column.id&&query.direction==="asc"?"menurun":"menaik"}`} onClick={()=>update({sort:header.column.id,direction:query.sort===header.column.id&&query.direction==="asc"?"desc":"asc",page:undefined})}>{header.isPlaceholder?null:<table.FlexRender header={header}/>}<AppIcon icon={query.sort===header.column.id&&query.direction==="asc"?faArrowUp:faArrowDown}/></button>:header.isPlaceholder?null:<table.FlexRender header={header}/>}</th>)}</tr>)}</thead><tbody>{table.getRowModel().rows.map((row)=><tr key={row.id}>{row.getAllCells().map((cell)=><td key={cell.id}><table.FlexRender cell={cell}/></td>)}</tr>)}</tbody></TableShell><div className="project-mobile-list">{data.items.map((item)=><article key={item.id}><StatusBadge tone={item.status==="Active"?"success":item.status==="Draft"?"info":"neutral"}>{item.status}</StatusBadge><strong>v{item.versionNumber} · {item.effectiveState}</strong><small>{formatDate(item.effectiveFrom)} - {item.effectiveTo?formatDate(item.effectiveTo):"seterusnya"} · {item.lineCount} line</small><Link href={access.url(`${pathname}/${item.id}`)}>Lihat versi</Link></article>)}</div></>}
 <div className="pagination"><Button variant="secondary" disabled={query.page<=1} onClick={()=>update({page:String(query.page-1)})}>Sebelumnya</Button><span>Halaman {data.total===0?0:query.page} dari {totalPages}</span><Button variant="secondary" disabled={!data.hasNextPage} onClick={()=>update({page:String(query.page+1)})}>Berikutnya</Button></div></Card></>;
}
