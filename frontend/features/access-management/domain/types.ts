import type { EntityId,IsoDateTime,VersionNumber } from "@/features/foundation/domain/models";
import type { CommandActor } from "@/features/projects/domain/commands";
import type { PaginatedResult,SortDirection } from "@/features/foundation/repositories/contracts";
export type AccessStatus="Active"|"Inactive";
export type PermissionKey="access.view"|"access.manage"|"project.view"|"project.manage"|"pic.approve";
export interface PermissionDefinition{key:PermissionKey;module:"Access"|"Project"|"Approval";label:string;description:string;risk:"Standard"|"Sensitive"|"Critical";}
export interface AccessUser{id:EntityId;employeeId:string;name:string;email:string;status:AccessStatus;roleIds:EntityId[];projectScopeIds:EntityId[];createdAt:IsoDateTime;updatedAt:IsoDateTime;version:VersionNumber;}
export interface AccessRole{id:EntityId;code:string;name:string;description:string;status:AccessStatus;permissionKeys:PermissionKey[];isSystem:boolean;createdAt:IsoDateTime;updatedAt:IsoDateTime;version:VersionNumber;}
export interface SodFinding{ruleId:"SOD-ADMIN-FINAL-APPROVAL";severity:"Critical";permissionKeys:readonly PermissionKey[];explanation:string;guidance:string;blocking:true;}
export interface UserListItem extends AccessUser{roleNames:readonly string[];effectivePermissions:readonly PermissionKey[];}
export interface RoleListItem extends AccessRole{userCount:number;sodFindings:readonly SodFinding[];}
export interface AccessListQuery{search?:string;statuses?:readonly AccessStatus[];roleIds?:readonly EntityId[];sort?:"name"|"status"|"updatedAt";direction?:SortDirection;page?:number;pageSize?:number;}
export interface NormalizedAccessListQuery{search:string;statuses:readonly AccessStatus[];roleIds:readonly EntityId[];sort:"name"|"status"|"updatedAt";direction:SortDirection;page:number;pageSize:number;}
export interface UserDetail{user:AccessUser;roles:readonly AccessRole[];effectivePermissions:readonly PermissionKey[];sodFindings:readonly SodFinding[];audit:readonly AccessAudit[];}
export interface RoleDetail{role:AccessRole;userCount:number;sodFindings:readonly SodFinding[];audit:readonly AccessAudit[];}
export interface AccessAudit{id:EntityId;actorUserId:EntityId;actorName?:string;action:string;objectType:"User"|"Role";objectId:EntityId;occurredAt:IsoDateTime;reason:string;correlationId:string;before?:Readonly<Record<string,unknown>>;after?:Readonly<Record<string,unknown>>;}
export interface UserFields{employeeId:string;name:string;email:string;roleIds:readonly EntityId[];projectScopeIds:readonly EntityId[];}
export interface RoleFields{code:string;name:string;description:string;permissionKeys:readonly PermissionKey[];}
export interface UserCommand{userId?:EntityId;currentVersion?:VersionNumber;data:UserFields;reason:string;actor:CommandActor;}
export interface RoleCommand{roleId?:EntityId;currentVersion?:VersionNumber;data:RoleFields;reason:string;actor:CommandActor;}
export interface LifecycleCommand{objectId:EntityId;currentVersion:VersionNumber;target:AccessStatus;reason:string;actor:CommandActor;}
export interface AccessMutationResult{objectType:"User"|"Role";objectId:EntityId;version:VersionNumber;message:string;correlationId:string;}
export interface AccessRepository{listUsers(query:NormalizedAccessListQuery,signal?:AbortSignal):Promise<PaginatedResult<UserListItem>>;getUser(id:EntityId,signal?:AbortSignal):Promise<UserDetail>;listUserAudit(id:EntityId,signal?:AbortSignal):Promise<readonly AccessAudit[]>;saveUser(command:UserCommand,signal?:AbortSignal):Promise<AccessMutationResult>;setUserStatus(command:LifecycleCommand,signal?:AbortSignal):Promise<AccessMutationResult>;listRoles(query:NormalizedAccessListQuery,signal?:AbortSignal):Promise<PaginatedResult<RoleListItem>>;getRole(id:EntityId,signal?:AbortSignal):Promise<RoleDetail>;listRoleAudit(id:EntityId,signal?:AbortSignal):Promise<readonly AccessAudit[]>;saveRole(command:RoleCommand,signal?:AbortSignal):Promise<AccessMutationResult>;setRoleStatus(command:LifecycleCommand,signal?:AbortSignal):Promise<AccessMutationResult>;listPermissions(signal?:AbortSignal):Promise<readonly PermissionDefinition[]>;evaluatePermissions(keys:readonly PermissionKey[]):readonly SodFinding[];}
