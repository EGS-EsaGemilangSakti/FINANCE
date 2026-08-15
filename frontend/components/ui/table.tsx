import type { ReactNode } from "react";

export function TableShell({ caption, children, footer }: { caption: string; children: ReactNode; footer?: ReactNode }) {
  return <div className="table-shell"><div className="table-scroll"><table><caption className="sr-only">{caption}</caption>{children}</table></div>{footer && <footer className="table-footer">{footer}</footer>}</div>;
}
