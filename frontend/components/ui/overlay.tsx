"use client";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { IconButton } from "./button";
import { AppIcon } from "./icon";

type OverlayProps = { open: boolean; title: string; description?: string; onClose: () => void; children: ReactNode; footer?: ReactNode };
function useDialog(open: boolean) { const ref = useRef<HTMLDialogElement>(null); useEffect(() => { const dialog=ref.current; if (!dialog) return; if (open && !dialog.open) dialog.showModal(); if (!open && dialog.open) dialog.close(); }, [open]); return ref; }
function OverlayContent({ title, titleId, description, onClose, children, footer }: OverlayProps & { titleId: string }) { return <><div className="overlay-head"><div><h2 id={titleId}>{title}</h2>{description && <p>{description}</p>}</div><IconButton label="Tutup panel" onClick={onClose}><AppIcon icon={faXmark}/></IconButton></div><div className="overlay-body">{children}</div>{footer && <footer className="overlay-footer">{footer}</footer>}</>; }
export function Modal(props: OverlayProps) { const ref=useDialog(props.open); const titleId=useId(); return <dialog ref={ref} className="modal" aria-labelledby={titleId} onCancel={(event)=>{event.preventDefault();props.onClose();}} onClose={props.onClose}><OverlayContent {...props} titleId={titleId}/></dialog>; }
export function Drawer(props: OverlayProps) { const ref=useDialog(props.open); const titleId=useId(); return <dialog ref={ref} className="drawer" aria-labelledby={titleId} onCancel={(event)=>{event.preventDefault();props.onClose();}} onClose={props.onClose}><OverlayContent {...props} titleId={titleId}/></dialog>; }
