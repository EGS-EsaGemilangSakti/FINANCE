import type { CommandActor } from "@/features/projects/domain/commands";
import type { EntityId,IsoDateTime,DocumentObjectType,VersionNumber } from "@/features/foundation/domain/models";
import type { PaginatedResult,SortDirection } from "@/features/foundation/repositories/contracts";

export type DocumentCategory="Project Brief"|"Contract"|"Rate Support"|"Other";
export type ManagedDocumentStatus="Active"|"Archived";
export type DocumentProcessingStatus="Pending"|"Scanning"|"Clean"|"Rejected"|"Failed";
export type DocumentValidationStatus="Pending"|"Valid"|"Rejected";
export type DocumentScanStatus="Pending"|"Scanning"|"Clean"|"Rejected"|"Failed";
export type DocumentScenario="clean"|"pending"|"scanning"|"malware"|"scanner-failure"|"server-failure";
export interface DocumentOwner{objectType:DocumentObjectType;objectId:EntityId;projectId:EntityId;label:string;}
export interface UploadMetadata{originalFileName:string;displayFileName:string;mimeType:string;sizeBytes:number;}
export interface ManagedDocumentVersion{id:EntityId;documentId:EntityId;versionNumber:number;originalFileName:string;displayFileName:string;mimeType:string;sizeBytes:number;uploadStatus:"Received"|"Failed";validationStatus:DocumentValidationStatus;scanStatus:DocumentScanStatus;processingStatus:DocumentProcessingStatus;uploadedByUserId:EntityId;uploadedAt:IsoDateTime;reason:string;notes:string;isCurrent:boolean;supersededAt?:IsoDateTime;failureMessage?:string;correlationId:string;version:VersionNumber;}
export interface ManagedDocument{id:EntityId;owner:DocumentOwner;category:DocumentCategory;title:string;description:string;status:ManagedDocumentStatus;required:boolean;currentVersionId?:EntityId;currentVersionNumber?:number;createdByUserId:EntityId;createdAt:IsoDateTime;updatedAt:IsoDateTime;version:VersionNumber;}
export interface DocumentListItem{id:EntityId;owner:DocumentOwner;category:DocumentCategory;title:string;status:ManagedDocumentStatus;required:boolean;currentVersionNumber?:number;currentFileName?:string;currentMimeType?:string;currentSizeBytes?:number;currentScanStatus?:DocumentScanStatus;latestProcessingStatus:DocumentProcessingStatus;uploadedByName?:string;updatedAt:IsoDateTime;version:number;}
export interface DocumentListQuery{search?:string;categories?:readonly DocumentCategory[];statuses?:readonly ManagedDocumentStatus[];processingStatuses?:readonly DocumentProcessingStatus[];completeness?:"all"|"clean"|"missing-clean";sort?:"category"|"title"|"status"|"updatedAt";direction?:SortDirection;page?:number;pageSize?:number;}
export interface NormalizedDocumentListQuery{search:string;categories:readonly DocumentCategory[];statuses:readonly ManagedDocumentStatus[];processingStatuses:readonly DocumentProcessingStatus[];completeness:"all"|"clean"|"missing-clean";sort:"category"|"title"|"status"|"updatedAt";direction:SortDirection;page:number;pageSize:number;}
export interface DocumentOwnerSummary{total:number;requiredComplete:number;pendingOrScanning:number;rejectedOrFailed:number;withoutCurrentClean:number;}
export interface DocumentListResult extends PaginatedResult<DocumentListItem>{owner:DocumentOwner;summary:DocumentOwnerSummary;}
export interface DocumentDetail{document:ManagedDocument;currentVersion?:ManagedDocumentVersion;versions:readonly ManagedDocumentVersion[];}
export interface DocumentReadiness{ready:boolean;requiredTotal:number;requiredComplete:number;missingCategories:readonly DocumentCategory[];}
export interface CreateDocumentCommand{owner:Omit<DocumentOwner,"label">;category:DocumentCategory;title:string;description:string;required:boolean;file:UploadMetadata;reason:string;notes:string;scenario:DocumentScenario;actor:CommandActor;}
export interface CreateDocumentVersionCommand{documentId:EntityId;currentVersion:VersionNumber;file:UploadMetadata;reason:string;notes:string;scenario:DocumentScenario;actor:CommandActor;}
export interface TransitionDocumentVersionCommand{documentId:EntityId;documentVersionId:EntityId;currentDocumentVersion:VersionNumber;currentVersionVersion:VersionNumber;target:DocumentProcessingStatus;reason:string;actor:CommandActor;}
export interface DocumentMutationResult{documentId:EntityId;documentVersionId:EntityId;documentAggregateVersion:number;documentVersionRecordVersion:number;processingStatus:DocumentProcessingStatus;currentVersionId?:EntityId;owner:DocumentOwner;message:string;correlationId:string;}
