import type { EntityId,IsoDate,ProjectStatus,VersionNumber } from "@/features/foundation/domain/models";
export interface CommandActor { userId:EntityId; permissionKeys:readonly string[]; }
export interface ProjectBranchInput { id?:EntityId; code:string; name:string; location:string; isActive:boolean; }
export interface ContractDocumentInput { fileName:string; mimeType:string; sizeBytes:number; }
export interface ProjectDraftFields { code:string; name:string; description:string; customerId:EntityId; vendorId?:EntityId; picUserId:EntityId; sphNumber:string; contractStartDate:IsoDate; contractEndDate:IsoDate; billingCycleId:EntityId; costCenter:string; branches:readonly ProjectBranchInput[]; serviceIds:readonly EntityId[]; contractDocument?:ContractDocumentInput; }
export interface CreateProjectInput extends ProjectDraftFields { actor:CommandActor; }
export interface UpdateProjectInput extends ProjectDraftFields { projectId:EntityId; currentVersion:VersionNumber; reason?:string; actor:CommandActor; }
export interface ActivateProjectInput { projectId:EntityId; currentVersion:VersionNumber; attested:boolean; actor:CommandActor; }
export interface ProjectMutationResult { projectId:EntityId; status:ProjectStatus; version:VersionNumber; message:string; correlationId:string; }
