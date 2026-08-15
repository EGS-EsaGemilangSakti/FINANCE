import { Suspense } from "react";
import { LoadingState } from "@/components/ui";
import { AttendanceImportPage } from "@/features/attendance/components/attendance-import-router";
export default function Page() { return <Suspense fallback={<LoadingState />}><AttendanceImportPage /></Suspense>; }
