import type { EntityId, IsoDateTime, VersionNumber } from "@/features/foundation/domain/models";
import type { PaginatedResult, SortDirection } from "@/features/foundation/repositories/contracts";

export type AttendanceStatus = "Draft" | "Imported" | "Validated" | "Calculated" | "Locked" | "Rejected";
export type MappingStatus = "Ready" | "Missing" | "Unrecognized";
export type IssueSeverity = "Error" | "Warning" | "Duplicate";
export type DuplicateDecision = "Blocking" | "Acknowledge" | "Allowed";
export interface AttendanceActor { userId: EntityId; permissionKeys: readonly string[]; }
export interface AttendanceFileMetadata { originalFilename: string; displayFilename: string; mimeType: string; sizeBytes: number; lastModified?: number; }
export interface AttendanceMapping { sourceColumn: string; targetField: string; required: boolean; status: MappingStatus; exampleValue: string; message?: string; }
export interface AttendanceIssue { id: EntityId; rowNumber: number; sourceColumn: string; targetField?: string; safeValue: string; reason: string; severity: IssueSeverity; code: string; suggestedAction?: string; }
export interface AttendanceSummary { totalRows: number; validRows: number; invalidRows: number; duplicateRows: number; warningRows: number; commitEligibleRows: number; blockingIssueCount: number; }
export interface DuplicateSummary { withinFile: number; priorBatch: number; fileDuplicate: boolean; decision: DuplicateDecision; note: string; simulated: true; }
export interface AttendanceRevision { id: EntityId; revisionNumber: number; sourceRevisionNumber?: number; reason: string; actorUserId: EntityId; createdAt: IsoDateTime; diffSummary: string; status: AttendanceStatus; }
export interface AttendanceActivity { id: EntityId; action: string; actorUserId: EntityId; actorName?: string; occurredAt: IsoDateTime; reason: string; correlationId: string; summary: string; }
export interface AttendanceBatch { id: EntityId; projectId: EntityId; projectLabel: string; period: string; status: AttendanceStatus; revisionNumber: number; file?: AttendanceFileMetadata; templateVersion?: string; mapping: readonly AttendanceMapping[]; summary: AttendanceSummary; duplicates: DuplicateSummary; createdAt: IsoDateTime; importedAt?: IsoDateTime; validatedAt?: IsoDateTime; lockedAt?: IsoDateTime; createdByUserId: EntityId; correlationId: string; version: VersionNumber; }
export interface AttendanceBatchDetail { batch: AttendanceBatch; revisions: readonly AttendanceRevision[]; activity: readonly AttendanceActivity[]; readiness: AttendanceReadiness; }
export interface AttendanceReadiness { readyToValidate: boolean; readyToLock: boolean; blockers: readonly string[]; nextAction: string; }
export interface AttendanceTemplateMetadata { available: boolean; version: string; label: string; reason: string; }
export interface AttendanceImportPreview { fingerprint: string; mapping: readonly AttendanceMapping[]; summary: AttendanceSummary; duplicates: DuplicateSummary; readiness: AttendanceReadiness; correlationId: string; simulated: true; }
export type AttendanceSortField = "period" | "projectLabel" | "status" | "createdAt";
export interface AttendanceListQuery { search?: string; statuses?: readonly AttendanceStatus[]; projectIds?: readonly EntityId[]; sort?: AttendanceSortField; direction?: SortDirection; page?: number; pageSize?: number; }
export interface NormalizedAttendanceListQuery { search: string; statuses: readonly AttendanceStatus[]; projectIds: readonly EntityId[]; sort: AttendanceSortField; direction: SortDirection; page: number; pageSize: 10 | 20 | 50; }
export interface AttendanceIssueQuery { search?: string; severities?: readonly IssueSeverity[]; sort?: "rowNumber" | "severity"; direction?: SortDirection; page?: number; pageSize?: number; }
export interface AttendanceSessionFile { metadata: AttendanceFileMetadata; scenario: "ready" | "issues" | "duplicate"; }
export interface AttendanceCommand<T> { data: T; actor: AttendanceActor; reason: string; currentVersion: VersionNumber; }
export interface AttendanceMutationResult { batchId: EntityId; version: VersionNumber; message: string; correlationId: string; }
export interface CreateAndImportAttendanceCommand { data: { projectId: EntityId; period: string; file: AttendanceFileMetadata; scenario: AttendanceSessionFile["scenario"]; previewFingerprint: string; commitDecision: "CommitAll" }; actor: AttendanceActor; reason: string; }
export interface AttendancePreviewCommand { data: { projectId: EntityId; period: string; file: AttendanceFileMetadata; scenario: AttendanceSessionFile["scenario"]; templateVersion?: string }; actor: AttendanceActor; }
export interface AttendanceRepository {
  list(input: AttendanceListQuery, signal?: AbortSignal): Promise<PaginatedResult<AttendanceBatch>>;
  get(id: EntityId, signal?: AbortSignal): Promise<AttendanceBatchDetail>;
  template(signal?: AbortSignal): Promise<AttendanceTemplateMetadata>;
  activity(id: EntityId, signal?: AbortSignal): Promise<readonly AttendanceActivity[]>;
  preview(input: AttendancePreviewCommand, signal?: AbortSignal): Promise<AttendanceImportPreview>;
  issues(id: EntityId, input: AttendanceIssueQuery, signal?: AbortSignal): Promise<PaginatedResult<AttendanceIssue>>;
  createDraft(input: { data: { projectId: EntityId; period: string }; actor: AttendanceActor }, signal?: AbortSignal): Promise<AttendanceMutationResult>;
  createAndImport(input: CreateAndImportAttendanceCommand, signal?: AbortSignal): Promise<AttendanceMutationResult>;
  importFile(input: AttendanceCommand<{ batchId: EntityId; file: AttendanceFileMetadata; scenario: AttendanceSessionFile["scenario"] }>, signal?: AbortSignal): Promise<AttendanceMutationResult>;
  validate(input: AttendanceCommand<{ batchId: EntityId; commitDecision: "CommitAll" }>, signal?: AbortSignal): Promise<AttendanceMutationResult>;
  reject(input: AttendanceCommand<{ batchId: EntityId }>, signal?: AbortSignal): Promise<AttendanceMutationResult>;
  correct(input: AttendanceCommand<{ batchId: EntityId; file: AttendanceFileMetadata; scenario: AttendanceSessionFile["scenario"]; previewFingerprint?: string }>, signal?: AbortSignal): Promise<AttendanceMutationResult>;
  lock(input: AttendanceCommand<{ batchId: EntityId }>, signal?: AbortSignal): Promise<AttendanceMutationResult>;
}
