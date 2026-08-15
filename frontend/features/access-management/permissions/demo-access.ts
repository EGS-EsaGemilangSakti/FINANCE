"use client";
import { useSearchParams } from "next/navigation";
export type AccessPersona="manage"|"view"|"none";
export function useAccessPersona(){const value=useSearchParams().get("access"),access:AccessPersona=value==="view"||value==="none"?value:"manage",canView=access!=="none",canManage=access==="manage",permissionKeys=canManage?["access.view","access.manage"]:canView?["access.view"]:[];return{access,canView,canManage,actor:{userId:"usr-dewi",permissionKeys},url:(path:string)=>`${path}${path.includes("?")?"&":"?"}access=${access}`};}
