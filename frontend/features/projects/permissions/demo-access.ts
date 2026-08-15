"use client";
import { useSearchParams } from "next/navigation";
export type DemoAccess="none"|"view"|"manage";
export function resolveDemoProjectAccess(value:string|null):DemoAccess{return value==="none"||value==="view"?value:"manage";}
export function projectDemoUrl(path:string,access:DemoAccess,params?:URLSearchParams|Readonly<Record<string,string|undefined>>){const query=params instanceof URLSearchParams?new URLSearchParams(params):new URLSearchParams();if(params&&!(params instanceof URLSearchParams))for(const [key,value] of Object.entries(params)){if(value)query.set(key,value);}query.set("access",access);return `${path}?${query.toString()}`;}
export function useDemoProjectAccess(){const access=resolveDemoProjectAccess(useSearchParams().get("access"));return{access,canView:access!=="none",canManage:access==="manage",actor:{userId:"usr-raka",permissionKeys:access==="manage"?["project.view","project.manage"]:access==="view"?["project.view"]:[]},url:(path:string,params?:URLSearchParams|Readonly<Record<string,string|undefined>>)=>projectDemoUrl(path,access,params)} as const;}
