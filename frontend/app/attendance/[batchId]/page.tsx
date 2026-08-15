import { Suspense } from "react";
import { LoadingState } from "@/components/ui";
import { AttendanceDetailPage } from "@/features/attendance/components/attendance-detail-page";
export default async function Page({ params }: PageProps<"/attendance/[batchId]">) { const { batchId } = await params; return <Suspense fallback={<LoadingState />}><AttendanceDetailPage id={batchId} /></Suspense>; }
