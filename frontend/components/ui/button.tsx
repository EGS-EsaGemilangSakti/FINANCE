import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "quiet" | "danger";
  size?: "sm" | "md";
  leadingIcon?: ReactNode;
};

export function Button({ variant = "primary", size = "md", leadingIcon, className = "", children, ...props }: ButtonProps) {
  return <button type="button" className={cn("button", `button-${variant}`, `button-${size}`, className)} {...props}>{leadingIcon}{children}</button>;
}

export function IconButton({ label, className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return <button type="button" className={cn("icon-button", className)} aria-label={label} title={label} {...props}>{children}</button>;
}
