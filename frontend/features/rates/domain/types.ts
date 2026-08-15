import type { CommandActor } from "@/features/projects/domain/commands";
import type { CurrencyCode,EntityId,IsoDate,IsoDateTime,VersionNumber } from "@/features/foundation/domain/models";
import type { PaginatedResult,SortDirection } from "@/features/foundation/repositories/contracts";

export type RateVersionStatus="Draft"|"Active"|"Superseded"|"Cancelled";
export type RateType="Fixed Amount"|"Formula";
export type EffectiveState="Current"|"Future"|"Historical";
export interface RateLine{id:EntityId;serviceId:EntityId;serviceCode:string;serviceName:string;branchId?:EntityId;branchCode?:string;branchName?:string;rateType:RateType;amount?:string;formula?:string;currency:CurrencyCode;unit:string;notes:string;scopeKey:string;}
export interface RateVersion{id:EntityId;projectId:EntityId;sourceVersionId?:EntityId;versionNumber:number;status:RateVersionStatus;effectiveFrom:IsoDate;effectiveTo?:IsoDate;reason:string;notes:string;lines:readonly RateLine[];createdByUserId:EntityId;createdAt:IsoDateTime;updatedAt:IsoDateTime;activatedByUserId?:EntityId;activatedAt?:IsoDateTime;version:VersionNumber;}
export interface RateVersionListItem{id:EntityId;versionNumber:number;status:RateVersionStatus;effectiveFrom:IsoDate;effectiveTo?:IsoDate;effectiveState:EffectiveState;lineCount:number;reason:string;actorName:string;createdAt:IsoDateTime;activatedAt?:IsoDateTime;version:VersionNumber;}
export interface RateProjectContext{projectId:EntityId;projectCode:string;projectName:string;projectStatus:string;customerName:string;sphNumber:string;contractStart:IsoDate;contractEnd:IsoDate;}
export interface RateListQuery{search?:string;statuses?:readonly RateVersionStatus[];effectiveStates?:readonly EffectiveState[];sort?:"versionNumber"|"status"|"effectiveFrom"|"createdAt";direction?:SortDirection;page?:number;pageSize?:number;}
export interface NormalizedRateListQuery{search:string;statuses:readonly RateVersionStatus[];effectiveStates:readonly EffectiveState[];sort:"versionNumber"|"status"|"effectiveFrom"|"createdAt";direction:SortDirection;page:number;pageSize:number;}
export interface RateProjectRateSummary{current?:RateVersionListItem;futureCount:number;historicalCount:number;draftCount:number;draftNeedsReviewCount:number;}
export type RateTimelineItem=RateVersionListItem;
export interface RateListResult extends PaginatedResult<RateVersionListItem>{context:RateProjectContext;summary:RateProjectRateSummary;timeline:readonly RateTimelineItem[];}
export interface RateVersionFields{effectiveFrom:IsoDate;effectiveTo?:IsoDate;reason:string;notes:string;lines:readonly Omit<RateLine,"id"|"serviceCode"|"serviceName"|"branchCode"|"branchName"|"scopeKey">[];}
export interface CreateRateDraftCommand{projectId:EntityId;sourceVersionId?:EntityId;data:RateVersionFields;actor:CommandActor;}
export interface UpdateRateDraftCommand{projectId:EntityId;rateVersionId:EntityId;currentVersion:VersionNumber;data:RateVersionFields;actor:CommandActor;}
export interface ActivateRateCommand{projectId:EntityId;rateVersionId:EntityId;currentVersion:VersionNumber;reason:string;attested:boolean;actor:CommandActor;}
export interface RateMutationResult{id:EntityId;version:number;status:RateVersionStatus;previousActiveId?:EntityId;message:string;correlationId:string;}
export interface RateOverlap{lineIndex:number;scopeKey:string;serviceName:string;scopeLabel:string;draftPeriod:string;existingVersionId:EntityId;existingVersionNumber:number;existingStatus:RateVersionStatus;existingPeriod:string;}
export type RateReferenceIssueCode="REFERENCE_NOT_FOUND"|"REFERENCE_INACTIVE"|"REFERENCE_OUTSIDE_PROJECT";
export interface RateReferenceIssue{lineIndex:number;lineId:EntityId;field:"serviceId"|"branchId";referenceId:EntityId;code:RateReferenceIssueCode;message:string;nextAction:string;snapshotLabel:string;}
export interface RateReferenceValidationResult{valid:boolean;issues:readonly RateReferenceIssue[];}
export interface RateReadinessCheck{code:string;label:string;complete:boolean;description:string;nextAction?:string;}
export interface RateReadiness{ready:boolean;checks:readonly RateReadinessCheck[];overlaps:readonly RateOverlap[];referenceValidation:RateReferenceValidationResult;}
export type RateDiffKind="Added"|"Changed"|"Removed";
export interface RateComparisonRow{key:string;kind:RateDiffKind;serviceName:string;scope:string;rateType:RateType;unit:string;previousValue?:string;newValue?:string;absoluteChange?:string;percentageChange?:string;}
export interface RateVersionComparison{source?:RateVersion;target:RateVersion;rows:readonly RateComparisonRow[];unchangedCount:number;}
export interface RateImpactSummary{projectId:EntityId;effectiveFrom:IsoDate;changedCount:number;addedCount:number;removedCount:number;future:boolean;historicalImmutable:true;nominalImpactAuthoritative:false;}
export interface RateVersionDetail{context:RateProjectContext;rate:RateVersion;readiness:RateReadiness;impact:RateImpactSummary;}
export interface RateRepository{list(projectId:EntityId,query:RateListQuery,signal?:AbortSignal):Promise<RateListResult>;getById(projectId:EntityId,id:EntityId,signal?:AbortSignal):Promise<RateVersionDetail>;getCurrentByProject(projectId:EntityId,signal?:AbortSignal):Promise<RateVersion|undefined>;createDraft(command:CreateRateDraftCommand,signal?:AbortSignal):Promise<RateMutationResult>;updateDraft(command:UpdateRateDraftCommand,signal?:AbortSignal):Promise<RateMutationResult>;getComparison(projectId:EntityId,id:EntityId,sourceId?:EntityId,signal?:AbortSignal):Promise<RateVersionComparison>;getImpact(projectId:EntityId,id:EntityId,signal?:AbortSignal):Promise<RateImpactSummary>;getReadiness(projectId:EntityId,id:EntityId,signal?:AbortSignal):Promise<RateReadiness>;activate(command:ActivateRateCommand,signal?:AbortSignal):Promise<RateMutationResult>;}
