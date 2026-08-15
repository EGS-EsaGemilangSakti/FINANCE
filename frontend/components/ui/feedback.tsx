import { faFileCirclePlus, faLock, faMagnifyingGlassMinus, faRotate, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import type { ReactNode } from "react";
import { AppIcon } from "./icon";
import { Button } from "./button";
export function Skeleton({ className = "" }: { className?: string }) { return <span className={`skeleton ${className}`} aria-hidden="true"/>; }
export function Alert({ tone = "info", title, children }: { tone?: "info" | "warning" | "danger" | "success"; title: string; children?: ReactNode }) { return <div className={`alert alert-${tone}`} role={tone === "danger" ? "alert" : "status"}><AppIcon icon={faTriangleExclamation}/><div><strong>{title}</strong>{children && <div>{children}</div>}</div></div>; }
type StateKind = "empty" | "zero" | "denied" | "conflict" | "validation" | "server";
const copy = { empty:[faFileCirclePlus,"Belum ada data","Tambahkan data pertama untuk memulai."], zero:[faMagnifyingGlassMinus,"Tidak ada hasil","Ubah atau hapus filter untuk melihat data lain."], denied:[faLock,"Akses terbatas","Anda tidak memiliki izin untuk melihat data ini."], conflict:[faRotate,"Data telah berubah","Tinjau versi terbaru sebelum memuat ulang agar input tetap aman."], validation:[faTriangleExclamation,"Periksa kembali isian","Detail kesalahan ditampilkan di dekat field terkait."], server:[faTriangleExclamation,"Data belum dapat dimuat","Coba kembali dan sertakan ID korelasi bila masalah berlanjut."] } as const;
export function DataState({ kind, correlationId, action, title, description }: { kind: StateKind; correlationId?: string; action?: ReactNode; title?: string; description?: string }) { const [icon,t,d]=copy[kind]; return <div className="data-state" role={kind === "validation" || kind === "server" ? "alert" : "status"}><span className="data-state-icon"><AppIcon icon={icon}/></span><h2>{title ?? t}</h2><p>{description ?? d}</p>{correlationId && <code>ID korelasi: {correlationId}</code>}{action}</div>; }
export function EmptyState(props: Omit<Parameters<typeof DataState>[0], "kind">) { return <DataState kind="empty" {...props}/>; }
export function LoadingState() { return <div className="loading-state" aria-busy="true" aria-label="Memuat data"><Skeleton/><Skeleton/><Skeleton/></div>; }
export function RetryAction() { return <Button variant="secondary" leadingIcon={<AppIcon icon={faRotate}/>}>Coba lagi</Button>; }
