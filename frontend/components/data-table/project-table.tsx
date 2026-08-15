"use client";
import { createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import { DataState, LoadingState, StatusBadge, TableShell } from "@/components/ui";
import { formatDate } from "@/lib/formatters";
import type { ProjectListItem } from "@/features/foundation/domain/models";
import { useProjectsQuery } from "@/features/foundation/queries/hooks";

const features=tableFeatures({}); const helper=createColumnHelper<typeof features,ProjectListItem>();
const columns=helper.columns([helper.accessor("name",{header:"Project",cell:({row,getValue})=><span className="project-name"><strong>{getValue()}</strong><small>{row.original.code}</small></span>}),helper.accessor("status",{header:"Status",cell:({getValue})=><StatusBadge tone={getValue()==="Active"?"success":getValue()==="On Hold"?"warning":"neutral"}>{getValue()}</StatusBadge>}),helper.accessor("updatedAt",{header:"Terakhir diperbarui",cell:({getValue})=>formatDate(getValue(),true)})]);
export function ProjectTable(){ const query=useProjectsQuery(); const table=useTable({features,columns,data:query.data?.items??[],getRowId:(row)=>row.id}); if(query.isPending)return <div className="table-state"><LoadingState/></div>; if(query.isError)return <DataState kind="server" correlationId={query.error.correlation_id} action={<button type="button" className="button button-secondary" onClick={()=>query.refetch()}>Coba lagi</button>}/>; if(!query.data.total)return <DataState kind="empty"/>; return <TableShell caption="Project dari repository mock"><thead>{table.getHeaderGroups().map((group)=><tr key={group.id}>{group.headers.map((header)=><th key={header.id} scope="col">{header.isPlaceholder?null:<table.FlexRender header={header}/>}</th>)}</tr>)}</thead><tbody>{table.getRowModel().rows.map((row)=><tr key={row.id}>{row.getAllCells().map((cell)=><td key={cell.id}><table.FlexRender cell={cell}/></td>)}</tr>)}</tbody></TableShell>; }
