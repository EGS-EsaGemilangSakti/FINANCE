import type { EntityId,IsoDateTime } from "@/features/foundation/domain/models";
import type { ListQuery,PaginatedResult } from "@/features/foundation/repositories/contracts";
import type { CommandActor } from "@/features/projects/domain/commands";

export type MasterStatus="Active"|"Inactive";
export type MasterKind="customers"|"vendors"|"services"|"billingCycles";
export type MasterSortField="code"|"name"|"status"|"updatedAt";
export type MasterListQuery=ListQuery<MasterStatus,MasterSortField>;
export interface UsageSummary{projectCount:number;projectIds:readonly EntityId[];historicalReferenceCount:number;canDeactivate:boolean;blockingReason?:string;}
export interface PartyRecord{id:EntityId;code:string;name:string;legalName:string;taxIdentifierMasked:string;billingAddress:string;city:string;province:string;postalCode:string;contactName:string;email:string;phone:string;paymentTermsDays:number;category:string;notes:string;status:MasterStatus;createdAt:IsoDateTime;updatedAt:IsoDateTime;version:number;}
export interface PartyListItem{ id:EntityId;code:string;name:string;legalName:string;taxIdentifierMasked:string;contact:string;location:string;projectCount:number;status:MasterStatus;updatedAt:IsoDateTime;version:number;}
export interface PartyDetail extends PartyRecord{usage:UsageSummary;}
export interface ReferenceRecord{id:EntityId;code:string;name:string;description:string;category:string;unit:string;frequency:"Monthly"|"Biweekly"|"Weekly";cutoffDay:number;invoiceOffsetDays:number;dueDays:number;status:MasterStatus;createdAt:IsoDateTime;updatedAt:IsoDateTime;version:number;}
export interface ReferenceListItem{id:EntityId;code:string;name:string;category:string;unitOrRule:string;projectCount:number;status:MasterStatus;updatedAt:IsoDateTime;version:number;}
export interface ReferenceDetail extends ReferenceRecord{usage:UsageSummary;humanRule:string;}
export interface PartyFields{code:string;name:string;legalName:string;taxIdentifier:string;billingAddress:string;city:string;province:string;postalCode:string;contactName:string;email:string;phone:string;paymentTermsDays:number;category:string;notes:string;}
export interface ServiceFields{code:string;name:string;description:string;category:string;unit:string;}
export interface BillingCycleFields{code:string;name:string;description:string;frequency:"Monthly"|"Biweekly"|"Weekly";cutoffDay:number;invoiceOffsetDays:number;dueDays:number;}
export type ReferenceFields=ServiceFields|BillingCycleFields;
export interface MasterCreate<T>{data:T;actor:CommandActor;}
export interface MasterUpdate<T>{id:EntityId;currentVersion:number;reason:string;data:T;actor:CommandActor;}
export type PartyCreateCommand=MasterCreate<PartyFields>;
export type PartyUpdateCommand=MasterUpdate<PartyFields>;
export type ReferenceCreateCommand=MasterCreate<ReferenceFields>;
export type ReferenceUpdateCommand=MasterUpdate<ReferenceFields>;
export interface MasterTransition{id:EntityId;currentVersion:number;active:boolean;reason:string;actor:CommandActor;}
export interface MasterMutationResult{id:EntityId;version:number;status:MasterStatus;message:string;correlationId:string;}
export interface MasterDataManagementRepository{
 listParties(kind:"customers"|"vendors",query:MasterListQuery,signal?:AbortSignal):Promise<PaginatedResult<PartyListItem>>;getParty(kind:"customers"|"vendors",id:EntityId,signal?:AbortSignal):Promise<PartyDetail>;createParty(kind:"customers"|"vendors",command:PartyCreateCommand,signal?:AbortSignal):Promise<MasterMutationResult>;updateParty(kind:"customers"|"vendors",command:PartyUpdateCommand,signal?:AbortSignal):Promise<MasterMutationResult>;
 listReferences(kind:"services"|"billingCycles",query:MasterListQuery,signal?:AbortSignal):Promise<PaginatedResult<ReferenceListItem>>;getReference(kind:"services"|"billingCycles",id:EntityId,signal?:AbortSignal):Promise<ReferenceDetail>;createReference(kind:"services"|"billingCycles",command:ReferenceCreateCommand,signal?:AbortSignal):Promise<MasterMutationResult>;updateReference(kind:"services"|"billingCycles",command:ReferenceUpdateCommand,signal?:AbortSignal):Promise<MasterMutationResult>;
 transition(kind:MasterKind,input:MasterTransition,signal?:AbortSignal):Promise<MasterMutationResult>;
}
