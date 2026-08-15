/** Stable entity identifier supplied by the authoritative data source. */
export type EntityId = string;
/** Calendar date serialized exactly as YYYY-MM-DD. */
export type IsoDate = string;
/** ISO-8601 timestamp including an explicit timezone offset or Z. */
export type IsoDateTime = string;
/** ISO-4217 currency code supported by the current product scope. */
export type CurrencyCode = "IDR";
/** Positive immutable version identifier within one versioned aggregate. */
export type VersionNumber = number;

export type ProjectStatus = "Draft" | "Active" | "On Hold" | "Closed" | "Cancelled";
export type UserStatus = "Active" | "Inactive";
export type DocumentStatus = "Processing" | "Available" | "Rejected" | "Superseded";
export type RateVersionStatus = "Scheduled" | "Active" | "Expired";

export interface ProjectBranch { id: EntityId; projectId: EntityId; code: string; name: string; location: string; isActive: boolean; }
export interface SphContract { id: EntityId; projectId: EntityId; number: string; startDate: IsoDate; endDate: IsoDate; billingCycleId: EntityId; costCenter: string; documentId: EntityId; }
export interface Project { id: EntityId; code: string; name: string; description: string; customerId: EntityId; vendorId?: EntityId; picUserId: EntityId; status: ProjectStatus; branchIds: EntityId[]; serviceIds: EntityId[]; sphId: EntityId; updatedAt: IsoDateTime; version: VersionNumber; }
export interface Customer { id: EntityId; code: string; name: string; npwpMasked: string; address: string; contactName: string; paymentTermsDays: number; isActive: boolean; }
export interface Vendor { id: EntityId; code: string; name: string; npwpMasked: string; address: string; contactName: string; paymentTermsDays: number; isActive: boolean; }
export interface Service { id: EntityId; code: string; name: string; category: string; unit: string; isActive: boolean; }
export interface BillingCycle { id: EntityId; name: string; frequency: "Monthly" | "Biweekly" | "Weekly"; cutoffRule: string; invoiceTiming: string; isActive: boolean; }
export interface TaxRule { id: EntityId; name: string; taxType: string; ratePercent: string; basis: "Configured per SPH"; roundingMethod: "Policy pending"; effectiveFrom: IsoDate; effectiveTo?: IsoDate; isActive: boolean; }
export interface RateVersion { id: EntityId; projectId: EntityId; sphId: EntityId; serviceId: EntityId; branchId?: EntityId; rateType: string; amount: string; currency: CurrencyCode; effectiveFrom: IsoDate; effectiveTo?: IsoDate; version: VersionNumber; status: RateVersionStatus; changeReason: string; createdByUserId: EntityId; createdAt: IsoDateTime; }
export interface Permission { id: EntityId; key: string; name: string; description: string; }
export interface Role { id: EntityId; name: string; description: string; permissionKeys: string[]; isReadOnly: boolean; }
export interface User { id: EntityId; name: string; email: string; status: UserStatus; roleIds: EntityId[]; }
export type DocumentObjectType = "Project" | "SPH" | "RateVersion";
export interface DocumentVersion { id: EntityId; documentId: EntityId; version: VersionNumber; fileName: string; mimeType: string; sizeBytes: number; checksumSha256: string; status: DocumentStatus; uploadedByUserId: EntityId; uploadedAt: IsoDateTime; }
export interface DocumentMetadata { id: EntityId; objectType: DocumentObjectType; objectId: EntityId; category: string; currentVersionId: EntityId; versionIds: EntityId[]; }
export interface AuditEvent { id: EntityId; actorUserId: EntityId; action: string; objectType: string; objectId: EntityId; occurredAt: IsoDateTime; reason?: string; before?: Readonly<Record<string, unknown>>; after?: Readonly<Record<string, unknown>>; correlationId: string; documentId?: EntityId; }

export interface ProjectDocumentGroups { project: readonly DocumentMetadata[]; sph: readonly DocumentMetadata[]; byRateVersion: Readonly<Record<EntityId, readonly DocumentMetadata[]>>; }
export interface ProjectAggregate { project: Project; branches: readonly ProjectBranch[]; sph: SphContract; rates: readonly RateVersion[]; documents: ProjectDocumentGroups; }
export interface ProjectReadinessSummary { ready: boolean; completedCount: number; totalCount: number; blockerCount: number; }
export interface ProjectListItem {
  id: EntityId; code: string; name: string;
  customerId: EntityId; customerName: string;
  picUserId: EntityId; picName: string;
  billingCycleId: EntityId; billingCycleName: string;
  contractStart: IsoDate; contractEnd: IsoDate;
  branchCount: number; serviceCount: number;
  status: ProjectStatus; readiness: ProjectReadinessSummary;
  updatedAt: IsoDateTime; version: VersionNumber;
}
export interface DashboardChartPoint { period: string; revenue: number; cost: number; profit: number; }
export interface DashboardWorkItem { id: string; title: string; detail: string; kind: "overdue" | "approval" | "confirmation"; }
export interface DashboardSnapshot { asOf: IsoDateTime; revenue: string; projectCost: string; grossProfit: string; arOutstanding: string; overdueAr: string; projects: readonly Project[]; chartSeries: readonly DashboardChartPoint[]; workItems: readonly DashboardWorkItem[]; }
export const DEMO_DATA_LABEL = "Data demo - belum terhubung API";
