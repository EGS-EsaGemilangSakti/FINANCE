import type { AuditEvent,BillingCycle,Customer,DashboardSnapshot,EntityId,IsoDate,Permission,ProjectAggregate,ProjectListItem,ProjectStatus,Role,Service,TaxRule,User,Vendor } from "../domain/models";
import type { DocumentRepository } from "@/features/documents/domain/repository";
import type { RateRepository } from "@/features/rates/domain/types";
import type { ActivateProjectInput,CreateProjectInput,ProjectMutationResult,UpdateProjectInput } from "@/features/projects/domain/commands";
import type { ProjectReadinessResult } from "@/features/projects/domain/readiness";
import type { MasterDataManagementRepository } from "@/features/master-data/domain/types";
export type SortDirection="asc"|"desc";
export interface ListQuery<TStatus extends string,TSort extends string>{search?:string;statuses?:readonly TStatus[];sort?:TSort;direction?:SortDirection;page?:number;pageSize?:number;}
export type ProjectSortField="code"|"name"|"status"|"contractStart"|"contractEnd"|"updatedAt";
export interface ProjectListQuery extends ListQuery<ProjectStatus,ProjectSortField>{customerIds?:readonly EntityId[];picUserIds?:readonly EntityId[];billingCycleIds?:readonly EntityId[];contractStartFrom?:IsoDate;contractEndTo?:IsoDate;}
export interface PaginatedResult<T>{items:readonly T[];total:number;page:number;pageSize:number;hasNextPage:boolean;}
export interface ProjectRepository{list(params:ProjectListQuery,signal?:AbortSignal):Promise<PaginatedResult<ProjectListItem>>;getById(id:EntityId,signal?:AbortSignal):Promise<ProjectAggregate>;getReadiness(id:EntityId,signal?:AbortSignal):Promise<ProjectReadinessResult>;create(input:CreateProjectInput,signal?:AbortSignal):Promise<ProjectMutationResult>;update(input:UpdateProjectInput,signal?:AbortSignal):Promise<ProjectMutationResult>;activate(input:ActivateProjectInput,signal?:AbortSignal):Promise<ProjectMutationResult>;}
export interface MasterDataRepository extends Partial<MasterDataManagementRepository>{listCustomers(signal?:AbortSignal):Promise<readonly Customer[]>;listVendors(signal?:AbortSignal):Promise<readonly Vendor[]>;listServices(signal?:AbortSignal):Promise<readonly Service[]>;listBillingCycles(signal?:AbortSignal):Promise<readonly BillingCycle[]>;listTaxRules(signal?:AbortSignal):Promise<readonly TaxRule[]>;}
export interface IdentityRepository{getCurrentUser(signal?:AbortSignal):Promise<User>;listUsers(signal?:AbortSignal):Promise<readonly User[]>;listRoles(signal?:AbortSignal):Promise<readonly Role[]>;listPermissions(signal?:AbortSignal):Promise<readonly Permission[]>;}
export interface AuditRepository{listByObject(objectType:string,objectId:EntityId,signal?:AbortSignal):Promise<readonly AuditEvent[]>;}
export interface DashboardRepository{getSnapshot(signal?:AbortSignal):Promise<DashboardSnapshot>;}
export interface RepositoryRegistry{projects:ProjectRepository;masterData:MasterDataRepository;rates:RateRepository;identity:IdentityRepository;documents:DocumentRepository;audit:AuditRepository;dashboard:DashboardRepository;}
