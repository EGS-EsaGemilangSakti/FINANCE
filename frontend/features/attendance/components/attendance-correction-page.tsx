"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { type FileRejection, useDropzone } from "react-dropzone";
import { Alert, Badge, Button, Card, CardHeader, DataState, Input, LoadingState, Modal, PageHeader, TableShell } from "@/components/ui";
import { isRequestCancellation } from "@/features/foundation/domain/errors";
import { DEMO_FILE_POLICY, validateFileMetadata } from "../domain/logic";
import { mapAttendanceMutationError, type AttendanceMutationErrorView } from "../domain/mutation-error";
import type { AttendanceImportPreview, AttendanceSessionFile } from "../domain/types";
import { useAttendanceAccess } from "../permissions/demo-access";
import { useAttendanceDetail, useCorrectAttendance, usePreviewAttendance } from "../queries/hooks";
import { AttendanceConflictDetails } from "./attendance-conflict-details";

export function AttendanceCorrectionPage({ batchId }: { batchId: string }) {
  const access = useAttendanceAccess();
  const router = useRouter();
  const detail = useAttendanceDetail(batchId, access.canManage);
  const correction = useCorrectAttendance();
  const previewMutation = usePreviewAttendance();
  const [session, setSession] = useState<AttendanceSessionFile>();
  const [preview, setPreview] = useState<AttendanceImportPreview>();
  const [reason, setReason] = useState("");
  const [failure, setFailure] = useState<AttendanceMutationErrorView>();
  const [guard, setGuard] = useState(false);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const fileRegionRef = useRef<HTMLDivElement>(null);
  const dirty = Boolean(session || preview || reason);

  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const showFileErrors = (errors: readonly string[]) => {
    setFailure({ status: 422, code: "ATTENDANCE_FILE_INVALID", message: "File correction tidak valid.", fieldErrors: { file: errors }, globalErrors: [], retryable: false, correlationId: "local-correction-file" });
    queueMicrotask(() => { errorSummaryRef.current?.focus(); fileRegionRef.current?.focus(); });
  };
  const selectFile = (file: File) => {
    const metadata = { originalFilename: file.name, displayFilename: file.name, mimeType: file.type, sizeBytes: file.size, lastModified: file.lastModified };
    const errors = validateFileMetadata(metadata);
    setSession({ metadata, scenario: file.name.toLocaleLowerCase("id-ID").includes("ready") ? "ready" : "issues" });
    setPreview(undefined);
    if (errors.length) showFileErrors(errors); else setFailure(undefined);
  };
  const handleRejected = (rejections: readonly FileRejection[]) => {
    const file = rejections[0]?.file;
    if (file) selectFile(file);
  };
  const dropzone = useDropzone({
    multiple: false,
    accept: { [DEMO_FILE_POLICY.mimeTypes[0]]: [".xlsx"] },
    maxSize: DEMO_FILE_POLICY.maxBytes,
    onDropAccepted: files => { if (files[0]) selectFile(files[0]); },
    onDropRejected: handleRejected,
  });

  if (!access.canManage) return <DataState kind="denied" title="Correction attendance tidak diizinkan" />;
  if (detail.isPending) return <LoadingState />;
  if (detail.isError) {
    const error = mapAttendanceMutationError(detail.error);
    return <DataState kind={error.status === 404 ? "empty" : error.status === 403 ? "denied" : "server"} correlationId={error.correlationId} />;
  }

  const createPreview = async () => {
    if (!session) { showFileErrors(["File correction wajib dipilih."]); return; }
    const fileErrors = validateFileMetadata(session.metadata);
    if (fileErrors.length) { showFileErrors(fileErrors); return; }
    try {
      setFailure(undefined);
      setPreview(await previewMutation.mutateAsync({ data: { projectId: detail.data.batch.projectId, period: detail.data.batch.period, file: session.metadata, scenario: session.scenario, templateVersion: detail.data.batch.templateVersion }, actor: access.actor }));
    } catch (error) {
      if (!isRequestCancellation(error)) setFailure(mapAttendanceMutationError(error));
    }
  };
  const commit = async () => {
    if (!session || !preview || reason.trim().length < 3) return;
    try {
      setFailure(undefined);
      const response = await correction.mutateAsync({ data: { batchId, file: session.metadata, scenario: session.scenario, previewFingerprint: preview.fingerprint }, actor: access.actor, reason, currentVersion: detail.data.batch.version });
      setSession(undefined);
      setPreview(undefined);
      router.push(access.url(`/attendance/${response.batchId}`));
    } catch (error) {
      if (!isRequestCancellation(error)) setFailure(mapAttendanceMutationError(error));
    }
  };
  const conflict = failure?.conflict;

  return <>
    <PageHeader eyebrow="Attendance Correction" title={`Buat revision dari R${detail.data.batch.revisionNumber}`} description="Revision historis tetap read-only; hasil correction kembali ke Imported." meta={<Badge tone="warning">Correction demo</Badge>} actions={<Button variant="secondary" onClick={() => dirty ? setGuard(true) : router.push(access.url(`/attendance/${batchId}`))}>Kembali</Button>} />
    <Card>
      <CardHeader title="File correction" />
      {failure?.fieldErrors.file && <div ref={errorSummaryRef} tabIndex={-1} role="alert"><strong>Periksa file correction</strong><ul>{failure.fieldErrors.file.map(message => <li key={message}>{message}</li>)}</ul></div>}
      <div ref={fileRegionRef} tabIndex={0} {...dropzone.getRootProps({ className: "attendance-dropzone", role: "button", "aria-label": "Pilih file correction attendance", "aria-describedby": "correction-help correction-error", "aria-invalid": Boolean(failure?.fieldErrors.file) })}>
        <input {...dropzone.getInputProps({ "aria-label": "file upload" })} />
        <strong>Letakkan file correction atau aktifkan dengan keyboard</strong>
        <span id="correction-help">File disimpan hanya dalam session sampai mutation berhasil.</span>
      </div>
      <div id="correction-error" role="alert" aria-live="assertive">{failure?.fieldErrors.file?.join(" ")}</div>
      {session && <div className="file-summary"><strong>{session.metadata.displayFilename}</strong><span>{session.metadata.mimeType || "MIME kosong"} · {session.metadata.sizeBytes} byte</span><Button variant="secondary" onClick={() => { setSession(undefined); setPreview(undefined); setFailure(undefined); }}>Hapus file</Button></div>}
      <Input label="Alasan correction" value={reason} onChange={event => setReason(event.target.value)} />
      <Button onClick={() => void createPreview()} disabled={previewMutation.isPending}>Buat preview correction</Button>
    </Card>
    {preview && <Card>
      <CardHeader title={`Preview R${detail.data.batch.revisionNumber} → R${detail.data.batch.revisionNumber + 1}`} />
      <TableShell caption="Mapping correction"><thead><tr><th>Source</th><th>Target</th><th>Status</th><th>Example</th></tr></thead><tbody>{preview.mapping.map(item => <tr key={item.sourceColumn}><td>{item.sourceColumn}</td><td>{item.targetField}</td><td>{item.status}</td><td>{item.exampleValue}</td></tr>)}</tbody></TableShell>
      <p>Total {preview.summary.totalRows}; invalid {preview.summary.invalidRows}; duplicate {preview.summary.duplicateRows}; blocking {preview.summary.blockingIssueCount}.</p>
      <p>Within file: {preview.duplicates.withinFile}; prior batch: {preview.duplicates.priorBatch}; file duplicate: {preview.duplicates.fileDuplicate ? "Ya" : "Tidak"}; keputusan: {preview.duplicates.decision}.</p>
      <Alert tone={preview.readiness.readyToValidate ? "success" : "warning"} title="Next action">{preview.readiness.nextAction}{preview.readiness.blockers.length > 0 && <ul>{preview.readiness.blockers.map(item => <li key={item}>{item}</li>)}</ul>}</Alert>
      <p>Safe diff: file metadata dan hasil preview akan menjadi revision baru; revision lama tidak ditimpa.</p>
      <Button onClick={() => void commit()} disabled={!preview.readiness.readyToValidate || reason.trim().length < 3 || correction.isPending}>Buat revision correction</Button>
    </Card>}
    {failure && !failure.fieldErrors.file && <Alert tone="danger" title={`${failure.code}: ${failure.message}`}>
      {failure.globalErrors.length > 0 && <ul>{failure.globalErrors.map(message => <li key={message}>{message}</li>)}</ul>}
      <small>ID korelasi: {failure.correlationId}</small>
      {failure.retryable && <Button onClick={() => preview ? void commit() : void createPreview()} disabled={correction.isPending || previewMutation.isPending}>Coba lagi</Button>}
      {conflict && <AttendanceConflictDetails conflict={conflict} />}
      {conflict && <div className="page-actions"><Link className="button button-secondary" href={access.url(`/attendance/${batchId}`)}>Muat versi terbaru</Link><Link className="button button-quiet" href={access.url("/attendance")}>Kembali tanpa menyimpan</Link></div>}
    </Alert>}
    <Modal open={guard} onClose={() => setGuard(false)} title="Perubahan belum disimpan" footer={<><Button onClick={() => setGuard(false)}>Tetap di halaman</Button><Button variant="danger" onClick={() => router.push(access.url(`/attendance/${batchId}`))}>Keluar tanpa menyimpan</Button></>}>File, reason, dan preview correction akan hilang.</Modal>
  </>;
}
