"use client";

import { faBars, faBell, faCalendarCheck, faChartLine, faChevronDown, faCircleCheck, faDatabase, faFileInvoiceDollar, faFolderOpen, faGaugeHigh, faMagnifyingGlass, faMoneyCheckDollar, faShieldHalved, faUsersGear, faXmark } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { AppIcon, IconButton } from "@/components/ui";
import { cn } from "@/lib/utils";

const navigation = [["Ringkasan", faGaugeHigh, "/"], ["Project", faFolderOpen, "/projects"], ["Master Data", faDatabase, "/master-data/customers"], ["Attendance", faCalendarCheck, "/attendance"], ["Payroll Billing", faFileInvoiceDollar, "/payroll-billing"], ["Invoice", faFileInvoiceDollar, "/invoices"], ["Disbursement", faMoneyCheckDollar, ""], ["Laporan", faChartLine, ""], ["Audit", faShieldHalved, ""], ["Administrasi", faUsersGear, "/admin/users"]] as const;
const mobileNavigation = [navigation[0], navigation[1], navigation[3], navigation[4], navigation[5]];

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const params = useSearchParams();
  const access = params.get("access");
  const hrefFor = (href: string) => href && (access === "view" || access === "none" || access === "review") && ["/projects", "/master-data", "/attendance", "/payroll-billing", "/invoices", "/admin"].some(prefix => href.startsWith(prefix)) ? `${href}?access=${access}` : href;
  const active = (href: string) => href === "/" ? pathname === href : pathname.startsWith(href);
  const navItem = ([label, icon, href]: (typeof navigation)[number]) => href ? <Link href={hrefFor(href)} key={label} className={cn("nav-item", active(href) && "is-active")} aria-current={active(href) ? "page" : undefined} onClick={() => setOpen(false)}><AppIcon icon={icon} /><span>{label}</span></Link> : <span key={label} className="nav-item is-disabled" aria-disabled="true"><AppIcon icon={icon} /><span>{label}</span></span>;
  return <div className="app-shell"><aside className={cn("sidebar", open && "is-open")} aria-label="Navigasi utama"><div className="brand"><span className="brand-logo"><Image src="/image/logo_fix.svg" alt="" width={38} height={54} priority /></span><span><strong>ESA Finance</strong><small>Project Operations</small></span><IconButton label="Tutup navigasi" className="sidebar-close" onClick={() => setOpen(false)}><AppIcon icon={faXmark} /></IconButton></div><nav><p className="nav-label">Workspace</p>{navigation.map(navItem)}</nav><div className="system-health"><AppIcon icon={faCircleCheck} /><span><strong>Semua sistem normal</strong><small>Mock status · data demo</small></span></div></aside>{open && <button className="sidebar-scrim" aria-label="Tutup navigasi" onClick={() => setOpen(false)} />}<div className="app-main"><header className="topbar"><IconButton label="Buka navigasi" className="menu-trigger" onClick={() => setOpen(true)}><AppIcon icon={faBars} /></IconButton><label className="global-search"><span className="sr-only">Pencarian global</span><AppIcon icon={faMagnifyingGlass} /><input type="search" placeholder="Cari project, invoice, atau vendor..." /><kbd>Ctrl K</kbd></label><div className="top-actions"><IconButton label="Notifikasi (placeholder)"><AppIcon icon={faBell} /><i className="notification-dot" /></IconButton><button className="profile-menu" type="button" aria-label="Buka menu profil"><span className="avatar">DS</span><span><strong>Dewi Sari</strong><small>Finance Manager</small></span><AppIcon icon={faChevronDown} /></button></div></header><main id="main-content" className="page-content" tabIndex={-1}>{children}</main><nav className="mobile-nav" aria-label="Navigasi mobile">{mobileNavigation.map(navItem)}</nav></div></div>;
}
