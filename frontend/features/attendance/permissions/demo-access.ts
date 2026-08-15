"use client";
import { useSearchParams } from "next/navigation";
export type AttendanceAccess = "manage" | "view" | "none";
export function useAttendanceAccess() { const value = useSearchParams().get("access"), access: AttendanceAccess = value === "view" || value === "none" ? value : "manage"; return { access, canView: access !== "none", canManage: access === "manage", actor: { userId: "usr-raka", permissionKeys: access === "manage" ? ["attendance.import", "attendance.validate"] : ["attendance.view"] }, url: (path: string, params?: URLSearchParams) => { const next = new URLSearchParams(params); next.set("access", access); return `${path}?${next.toString()}`; } } as const; }
