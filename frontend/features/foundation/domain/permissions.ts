import type { Permission,Role,User } from "./models";
export interface PermissionContext { user:User; roles:readonly Role[]; permissions:readonly Permission[]; }
export function effectivePermissionKeys(context:PermissionContext){const roleIds=new Set(context.user.roleIds);return new Set(context.roles.filter((role)=>roleIds.has(role.id)).flatMap((role)=>role.permissionKeys));}
export function can(context:PermissionContext,permissionKey:string){return effectivePermissionKeys(context).has(permissionKey);}
export function canAny(context:PermissionContext,permissionKeys:readonly string[]){const effective=effectivePermissionKeys(context);return permissionKeys.some((key)=>effective.has(key));}
const MASK_CHARACTER="\u2022";
export interface MaskSensitiveOptions { visibleSuffix?:number; maskLimit?:number; }
export function maskSensitive(value:string|null|undefined,{visibleSuffix=4,maskLimit=8}:MaskSensitiveOptions={}):string { if(!value)return ""; const safeSuffix=Math.max(0,Math.trunc(visibleSuffix)); const hiddenLength=Math.max(0,value.length-safeSuffix); if(hiddenLength===0)return MASK_CHARACTER.repeat(value.length); const maskLength=maskLimit<=0?hiddenLength:Math.min(Math.max(1,Math.trunc(maskLimit)),hiddenLength); return `${MASK_CHARACTER.repeat(maskLength)}${safeSuffix===0?"":value.slice(-safeSuffix)}`; }
