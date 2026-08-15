import type { DocumentMetadata,DocumentObjectType,DocumentVersion,EntityId } from "@/features/foundation/domain/models";
import type { CreateDocumentCommand,CreateDocumentVersionCommand,DocumentDetail,DocumentListQuery,DocumentListResult,DocumentMutationResult,DocumentReadiness,TransitionDocumentVersionCommand } from "./types";
export interface DocumentRepository{
 listByObject(objectType:DocumentObjectType,objectId:EntityId,signal?:AbortSignal):Promise<readonly DocumentMetadata[]>;
 listVersions(documentId:EntityId,signal?:AbortSignal):Promise<readonly DocumentVersion[]>;
 listByOwner(objectType:DocumentObjectType,objectId:EntityId,query:DocumentListQuery,signal?:AbortSignal):Promise<DocumentListResult>;
 getDocument(documentId:EntityId,signal?:AbortSignal):Promise<DocumentDetail>;
 createDocument(command:CreateDocumentCommand,signal?:AbortSignal):Promise<DocumentMutationResult>;
 createVersion(command:CreateDocumentVersionCommand,signal?:AbortSignal):Promise<DocumentMutationResult>;
 getReadiness(objectType:DocumentObjectType,objectId:EntityId,signal?:AbortSignal):Promise<DocumentReadiness>;
 transitionVersionStatus(command:TransitionDocumentVersionCommand,signal?:AbortSignal):Promise<DocumentMutationResult>;
}
