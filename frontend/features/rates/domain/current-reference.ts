import type { Project,ProjectBranch,Service } from "@/features/foundation/domain/models";
import type { RateReferenceIssue,RateReferenceValidationResult,RateVersion } from "./types";

export interface CurrentRateReferences{services:readonly Service[];branches:readonly ProjectBranch[];}

export function validateCurrentRateReferences(rate:RateVersion,project:Project,references:CurrentRateReferences):RateReferenceValidationResult{
 const issues:RateReferenceIssue[]=[];
 const add=(issue:RateReferenceIssue)=>issues.push(issue);
 rate.lines.forEach((line,lineIndex)=>{
  const service=references.services.find((item)=>item.id===line.serviceId),serviceBase={lineIndex,lineId:line.id,field:"serviceId" as const,referenceId:line.serviceId,snapshotLabel:`${line.serviceCode} · ${line.serviceName}`};
  if(!service)add({...serviceBase,code:"REFERENCE_NOT_FOUND",message:"Service sudah tidak tersedia pada master data.",nextAction:"Pilih service aktif dan simpan ulang Draft."});
  else if(!service.isActive)add({...serviceBase,code:"REFERENCE_INACTIVE",message:"Service sudah tidak aktif.",nextAction:"Pilih service aktif dan simpan ulang Draft."});
  else if(!project.serviceIds.includes(service.id))add({...serviceBase,code:"REFERENCE_OUTSIDE_PROJECT",message:"Service bukan lagi bagian konfigurasi project.",nextAction:"Perbarui konfigurasi project atau pilih service yang masih terhubung."});
  if(!line.branchId)return;
  const branch=references.branches.find((item)=>item.id===line.branchId),branchBase={lineIndex,lineId:line.id,field:"branchId" as const,referenceId:line.branchId,snapshotLabel:line.branchName?`${line.branchCode??line.branchId} · ${line.branchName}`:line.branchId};
  if(!branch)add({...branchBase,code:"REFERENCE_NOT_FOUND",message:"Cabang sudah tidak tersedia pada master data.",nextAction:"Pilih cabang aktif dan simpan ulang Draft."});
  else if(!branch.isActive)add({...branchBase,code:"REFERENCE_INACTIVE",message:"Cabang sudah tidak aktif.",nextAction:"Pilih cabang aktif dan simpan ulang Draft."});
  else if(branch.projectId!==project.id)add({...branchBase,code:"REFERENCE_OUTSIDE_PROJECT",message:"Cabang bukan lagi milik project ini.",nextAction:"Pilih cabang milik project dan simpan ulang Draft."});
 });
 return{valid:issues.length===0,issues};
}
