"use client";
import { useSearchParams } from "next/navigation";
import type { CommandActor } from "@/features/projects/domain/commands";
export type MasterAccess="manage"|"view"|"none";
export function resolveMasterAccess(value:string|null):MasterAccess{return value==="view"||value==="none"?value:"manage";}
export function masterUrl(path:string,access:MasterAccess,extra?:Readonly<Record<string,string|undefined>>){const query=new URLSearchParams();for(const [key,value] of Object.entries(extra??{}))if(value)query.set(key,value);query.set("access",access);return`${path}?${query}`;}
export function useMasterAccess(){const access=resolveMasterAccess(useSearchParams().get("access"));const actor:CommandActor={userId:"usr-raka",permissionKeys:access==="manage"?["master-data.view","master-data.manage","audit.view"]:access==="view"?["master-data.view","audit.view"]:[]};return{access,canView:actor.permissionKeys.includes("master-data.view"),canManage:actor.permissionKeys.includes("master-data.manage"),canAudit:actor.permissionKeys.includes("audit.view"),actor,url:(path:string,extra?:Readonly<Record<string,string|undefined>>)=>masterUrl(path,access,extra)};}
