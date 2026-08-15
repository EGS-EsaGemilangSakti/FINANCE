import { faCircleCheck, faCircleExclamation, faCircleInfo, faClock, faCircleXmark, faMinus } from "@fortawesome/free-solid-svg-icons";
import type { ReactNode } from "react";
import { AppIcon } from "./icon";
export type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "receivable";
export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) { return <span className={`badge badge-${tone}`}>{children}</span>; }
const icons = { success: faCircleCheck, warning: faCircleExclamation, danger: faCircleXmark, info: faCircleInfo, receivable: faClock, neutral: faMinus };
export function StatusBadge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) { return <span className={`status-badge badge-${tone}`}><AppIcon icon={icons[tone]}/>{children}</span>; }
