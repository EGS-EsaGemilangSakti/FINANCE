import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { type InputHTMLAttributes, type SelectHTMLAttributes } from "react";
import { AppIcon } from "./icon";
import { cn } from "@/lib/utils";

type FieldBase = { label: string; hint?: string; error?: string };
const fieldIdFromLabel = (label: string) => label.toLocaleLowerCase("id-ID").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export function Input({ label, hint, error, id, className, required, ...props }: InputHTMLAttributes<HTMLInputElement> & FieldBase) {
  const fieldId = id ?? props.name ?? fieldIdFromLabel(label); const messageId = `${fieldId}-message`;
  return <label className={cn("field", className)} htmlFor={fieldId}><span className="field-label">{label}{required && <span className="required-indicator" aria-hidden="true" />}</span><input id={fieldId} className="input" required={required} aria-invalid={error ? true : undefined} aria-describedby={(error || hint) ? messageId : undefined} {...props}/>{(error || hint) && <span id={messageId} className={error ? "field-error" : "field-hint"}>{error ?? hint}</span>}</label>;
}
export function Select({ label, hint, error, id, className, children, required, ...props }: SelectHTMLAttributes<HTMLSelectElement> & FieldBase) {
  const fieldId = id ?? props.name ?? fieldIdFromLabel(label); const messageId = `${fieldId}-message`;
  return <label className={cn("field", className)} htmlFor={fieldId}><span className="field-label">{label}{required && <span className="required-indicator" aria-hidden="true" />}</span><span className="select-wrap"><select id={fieldId} className="select" required={required} aria-invalid={error ? true : undefined} aria-describedby={(error || hint) ? messageId : undefined} {...props}>{children}</select><AppIcon icon={faChevronDown}/></span>{(error || hint) && <span id={messageId} className={error ? "field-error" : "field-hint"}>{error ?? hint}</span>}</label>;
}
