"use client";
import { useSearchParams } from "next/navigation";
import { AttendanceCorrectionPage } from "./attendance-correction-page";
import { NewAttendanceImportPage } from "./attendance-import-page";
export function AttendanceImportPage() { const correctionOf = useSearchParams().get("correctionOf"); return correctionOf ? <AttendanceCorrectionPage batchId={correctionOf} /> : <NewAttendanceImportPage />; }
