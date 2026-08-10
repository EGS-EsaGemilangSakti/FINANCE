"use client";

import Image from "next/image";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  Building2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  FileSpreadsheet,
  Gauge,
  HandCoins,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

const navGroups = [
  {
    label: "Workspace",
    items: [
      { label: "Overview", icon: LayoutDashboard, active: true },
      { label: "Projects", icon: Building2 },
      { label: "Attendance", icon: FileSpreadsheet, badge: "3" },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Billing & Invoice", icon: ReceiptText },
      { label: "Disbursement", icon: WalletCards, badge: "8" },
      { label: "Accounts Receivable", icon: HandCoins },
      { label: "Reports", icon: Activity },
    ],
  },
  {
    label: "Control",
    items: [
      { label: "Approvals", icon: FileCheck2, badge: "12" },
      { label: "Audit Trail", icon: ShieldCheck },
      { label: "Administration", icon: Settings },
    ],
  },
];

const metrics = [
  {
    label: "Total Revenue",
    value: "Rp 4,82 M",
    change: "+12,4%",
    helper: "dibanding bulan lalu",
    icon: CircleDollarSign,
    tone: "gold",
    up: true,
  },
  {
    label: "Project Cost",
    value: "Rp 3,14 M",
    change: "+5,8%",
    helper: "dibanding bulan lalu",
    icon: WalletCards,
    tone: "blue",
    up: false,
  },
  {
    label: "Gross Profit",
    value: "Rp 1,68 M",
    change: "+18,7%",
    helper: "margin 34,9%",
    icon: Gauge,
    tone: "green",
    up: true,
  },
  {
    label: "AR Outstanding",
    value: "Rp 986,4 Jt",
    change: "18 invoice",
    helper: "Rp 216,8 Jt overdue",
    icon: HandCoins,
    tone: "violet",
    up: false,
  },
];

const projects = [
  { code: "PRJ-ESA-026", name: "Facility Management - Jakarta", customer: "PT Aruna Nusantara", revenue: "1,24 M", cost: "768 Jt", profit: "472 Jt", margin: 38, status: "Sehat" },
  { code: "PRJ-ESA-019", name: "Security Services - Surabaya", customer: "PT Metro Industri", revenue: "982 Jt", cost: "698 Jt", profit: "284 Jt", margin: 29, status: "Perhatian" },
  { code: "PRJ-ESA-031", name: "Cleaning Operations - Bandung", customer: "CV Karya Prima", revenue: "846 Jt", cost: "528 Jt", profit: "318 Jt", margin: 37, status: "Sehat" },
  { code: "PRJ-ESA-014", name: "Manpower Supply - Cikarang", customer: "PT Sinar Logistik", revenue: "714 Jt", cost: "523 Jt", profit: "191 Jt", margin: 27, status: "Perhatian" },
];

const approvals = [
  { type: "Invoice", id: "INV/ESA/0826/0042", name: "PT Aruna Nusantara", amount: "Rp 184.750.000", age: "12 menit", tone: "invoice" },
  { type: "Payment Request", id: "PR-2026-0819", name: "PT Mitra Sarana", amount: "Rp 68.400.000", age: "34 menit", tone: "payment" },
  { type: "Rate Version", id: "PRJ-ESA-031 · v3", name: "Effective 01 Sep 2026", amount: "+4,2%", age: "1 jam", tone: "rate" },
];

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <aside className={`sidebar ${open ? "sidebar-open" : ""}`} aria-label="Navigasi utama">
      <div className="brand">
        <span className="brand-mark"><Image src="/image/logo_fix.svg" alt="Logo ESA" width={40} height={54} priority /></span>
        <span><strong>ESA Finance</strong><small>Project Operations</small></span>
        <button className="mobile-close" onClick={onClose} aria-label="Tutup menu"><X size={20} /></button>
      </div>
      <nav>
        {navGroups.map((group) => (
          <div className="nav-group" key={group.label}>
            <p>{group.label}</p>
            {group.items.map((item) => {
              const Icon = item.icon;
              return <button key={item.label} className={`nav-item ${item.active ? "active" : ""}`} onClick={onClose}><Icon size={18} strokeWidth={1.8} /><span>{item.label}</span>{item.badge && <em>{item.badge}</em>}</button>;
            })}
          </div>
        ))}
      </nav>
      <div className="side-status">
        <span className="live-dot" />
        <div><strong>Semua sistem normal</strong><small>Terakhir diperiksa 09:42</small></div>
      </div>
      <div className="profile-mini">
        <div className="avatar">DS</div>
        <div><strong>Dewi Sari</strong><small>Finance Manager</small></div>
        <MoreHorizontal size={18} />
      </div>
    </aside>
  );
}

export default function FinanceDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [period, setPeriod] = useState("Agustus 2026");
  const [tab, setTab] = useState("Profitability");
  const [notice, setNotice] = useState("");
  const greeting = useMemo(() => new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(2026, 7, 10)), []);

  const action = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && <button className="sidebar-scrim" onClick={() => setSidebarOpen(false)} aria-label="Tutup menu" />}
      <main className="main-area">
        <header className="topbar">
          <button className="menu-button" onClick={() => setSidebarOpen(true)} aria-label="Buka menu"><Menu size={22} /></button>
          <div className="search-box"><Search size={18} /><input aria-label="Pencarian global" placeholder="Cari project, invoice, atau vendor..." /><kbd>⌘ K</kbd></div>
          <div className="top-actions">
            <button className="icon-button" aria-label="Notifikasi" onClick={() => action("Tidak ada notifikasi baru")}><Bell size={19} /><span /></button>
            <div className="top-divider" />
            <button className="profile-button"><div className="avatar small">DS</div><span>Dewi Sari<small>Finance Manager</small></span><ChevronDown size={16} /></button>
          </div>
        </header>

        <div className="content">
          <section className="welcome-row">
            <div><p className="eyebrow">{greeting}</p><h1>Selamat pagi, Dewi.</h1><p className="subtitle">Berikut ringkasan kesehatan finance dan pekerjaan yang perlu Anda tindak lanjuti.</p></div>
            <div className="filter-row">
              <label><span>Project</span><select aria-label="Pilih project"><option>Semua project</option><option>PRJ-ESA-026</option><option>PRJ-ESA-019</option></select></label>
              <label><span>Periode</span><select aria-label="Pilih periode" value={period} onChange={(e) => setPeriod(e.target.value)}><option>Agustus 2026</option><option>Juli 2026</option><option>Juni 2026</option></select></label>
            </div>
          </section>

          <section className="metrics-grid" aria-label="Ringkasan keuangan">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return <article className="metric-card" key={metric.label}><div className={`metric-icon ${metric.tone}`}><Icon size={20} /></div><div className="metric-head"><span>{metric.label}</span><button aria-label={`Detail ${metric.label}`}><MoreHorizontal size={18} /></button></div><strong>{metric.value}</strong><p className={metric.up ? "trend-up" : "trend-neutral"}>{metric.up ? <ArrowUpRight size={14} /> : metric.label === "Project Cost" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}<b>{metric.change}</b><span>{metric.helper}</span></p></article>;
            })}
          </section>

          <section className="dashboard-grid">
            <article className="panel chart-panel">
              <div className="panel-header"><div><h2>Kinerja keuangan</h2><p>Revenue, cost, dan gross profit dalam 6 bulan</p></div><button className="text-button" onClick={() => action("Laporan kinerja disiapkan")}>Lihat laporan <ArrowRight size={15} /></button></div>
              <div className="legend"><span><i className="dot revenue" />Revenue</span><span><i className="dot cost" />Cost</span><span><i className="dot profit" />Gross profit</span></div>
              <div className="chart-wrap" aria-label="Grafik kinerja keuangan Februari hingga Agustus 2026">
                <div className="y-axis"><span>1,2 M</span><span>900 Jt</span><span>600 Jt</span><span>300 Jt</span><span>0</span></div>
                <div className="chart-grid-lines"><i /><i /><i /><i /><i /></div>
                <svg className="line-chart" viewBox="0 0 700 260" role="img" aria-label="Revenue meningkat dengan cost stabil dan profit bertumbuh">
                  <defs><linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d1a93f" stopOpacity=".2"/><stop offset="1" stopColor="#d1a93f" stopOpacity="0"/></linearGradient></defs>
                  <path className="area" d="M10 196 C75 174 105 185 150 160 S245 130 290 140 S385 111 430 116 S520 73 570 86 S650 40 690 51 L690 245 L10 245 Z" />
                  <path className="revenue-line" d="M10 196 C75 174 105 185 150 160 S245 130 290 140 S385 111 430 116 S520 73 570 86 S650 40 690 51" />
                  <path className="cost-line" d="M10 220 C72 204 105 207 150 194 S242 172 290 181 S380 163 430 166 S525 143 570 151 S650 121 690 129" />
                  <path className="profit-line" d="M10 234 C80 226 107 226 150 218 S240 207 290 211 S385 199 430 200 S520 185 570 191 S650 166 690 173" />
                  <circle cx="690" cy="51" r="5" className="chart-point" />
                </svg>
                <div className="x-axis"><span>Feb</span><span>Mar</span><span>Apr</span><span>Mei</span><span>Jun</span><span>Jul</span><span>Agu</span></div>
                <div className="chart-tip"><small>Agustus 2026</small><strong>Rp 1,12 M</strong><span>Revenue</span></div>
              </div>
            </article>

            <article className="panel attention-panel">
              <div className="panel-header"><div><h2>Perlu perhatian</h2><p>Prioritas hari ini</p></div><span className="count-badge">5 tugas</span></div>
              <div className="attention-list">
                <button onClick={() => action("Membuka 3 invoice overdue")}><span className="attention-icon red"><Clock3 size={18} /></span><span><strong>3 invoice overdue</strong><small>Rp 216,8 Jt perlu follow-up</small></span><ArrowRight size={17} /></button>
                <button onClick={() => action("Membuka approval payment")}><span className="attention-icon amber"><FileCheck2 size={18} /></span><span><strong>8 payment menunggu approval</strong><small>Terbesar Rp 82,4 Jt</small></span><ArrowRight size={17} /></button>
                <button onClick={() => action("Membuka konfirmasi customer")}><span className="attention-icon blue"><Users size={18} /></span><span><strong>2 konfirmasi customer</strong><small>Lewat dari target 2 hari</small></span><ArrowRight size={17} /></button>
              </div>
              <button className="full-button" onClick={() => action("Work queue dibuka")}>Buka work queue <ArrowRight size={16} /></button>
            </article>
          </section>

          <section className="dashboard-grid lower-grid">
            <article className="panel projects-panel">
              <div className="panel-header responsive-head"><div><h2>Performa project</h2><p>Profitability berdasarkan transaksi tercatat</p></div><div className="tabs" role="tablist">{["Profitability", "AR Aging"].map((name) => <button key={name} role="tab" aria-selected={tab === name} className={tab === name ? "selected" : ""} onClick={() => setTab(name)}>{name}</button>)}</div></div>
              <div className="table-wrap">
                <table><caption className="sr-only">Performa keuangan project</caption><thead><tr><th>Project</th><th>Revenue</th><th>Cost</th><th>Gross profit</th><th>Margin</th><th>Status</th><th /></tr></thead><tbody>{projects.map((project) => <tr key={project.code}><td><strong>{project.name}</strong><small>{project.code} · {project.customer}</small></td><td>Rp {project.revenue}</td><td>Rp {project.cost}</td><td className="profit-value">Rp {project.profit}</td><td><div className="margin-cell"><span>{project.margin}%</span><i><b style={{ width: `${project.margin}%` }} /></i></div></td><td><span className={`status-pill ${project.status === "Sehat" ? "healthy" : "warning"}`}>{project.status === "Sehat" ? <BadgeCheck size={13} /> : <Clock3 size={13} />}{project.status}</span></td><td><button aria-label={`Buka ${project.name}`} onClick={() => action(`Membuka ${project.code}`)}><ArrowRight size={16} /></button></td></tr>)}</tbody></table>
              </div>
              <div className="panel-footer"><span><i className="live-dot" />Data diperbarui 4 menit lalu</span><button onClick={() => action("Semua project dibuka")}>Lihat semua project <ArrowRight size={15} /></button></div>
            </article>

            <article className="panel approval-panel">
              <div className="panel-header"><div><h2>Menunggu persetujuan</h2><p>Approval PIC dengan prioritas tertinggi</p></div><span className="count-badge gold-count">12</span></div>
              <div className="approval-list">{approvals.map((item) => <button key={item.id} onClick={() => action(`Review ${item.id}`)}><span className={`approval-type ${item.tone}`}>{item.type === "Invoice" ? <ReceiptText size={17} /> : item.type === "Payment Request" ? <WalletCards size={17} /> : <Activity size={17} />}</span><span className="approval-copy"><small>{item.type}</small><strong>{item.id}</strong><em>{item.name}</em></span><span className="approval-amount"><strong>{item.amount}</strong><small>{item.age}</small></span></button>)}</div>
              <button className="full-button dark-button" onClick={() => action("Approval queue dibuka")}>Review semua approval <ArrowRight size={16} /></button>
            </article>
          </section>
        </div>
      </main>
      {notice && <div className="toast" role="status"><BadgeCheck size={18} />{notice}</div>}
    </div>
  );
}
