import { Suspense } from "react";
import { LoadingState } from "@/components/ui";
import { AttendanceListPage } from "@/features/attendance/components/attendance-list-page";
export default function Page() { return <Suspense fallback={<LoadingState />}><AttendanceListPage /></Suspense>; }
