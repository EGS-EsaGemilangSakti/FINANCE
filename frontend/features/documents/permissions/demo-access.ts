"use client";
import { useSearchParams } from "next/navigation";
import type { CommandActor } from "@/features/projects/domain/commands";
export type DocumentAccess="manage"|"view"|"none";
export function resolveDocumentAccess(value:string|null):DocumentAccess{return value==="view"||value==="none"?value:"manage";}
export function documentUrl(path:string,access:DocumentAccess,extra?:Readonly<Record<string,string|undefined>>){const params=new URLSearchParams();for(const [key,value] of Object.entries(extra??{}))if(value)params.set(key,value);params.set("access",access);return`${path}?${params}`;}
export function useDocumentAccess(){const access=resolveDocumentAccess(useSearchParams().get("access")),permissionKeys=access==="manage"?["document.view","document.manage","document.upload","audit.view"]:access==="view"?["document.view","audit.view"]:[],actor:CommandActor={userId:access==="manage"?"usr-raka":"usr-dewi",permissionKeys};return{access,actor,canView:permissionKeys.includes("document.view"),canManage:permissionKeys.includes("document.manage"),canUpload:permissionKeys.includes("document.upload"),canAudit:permissionKeys.includes("audit.view"),url:(path:string,extra?:Readonly<Record<string,string|undefined>>)=>documentUrl(path,access,extra)};}
