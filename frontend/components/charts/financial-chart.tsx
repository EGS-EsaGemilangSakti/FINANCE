"use client";

import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { formatRupiah } from "@/lib/formatters";
import type { DashboardChartPoint } from "@/features/foundation/domain/models";

export function FinancialChart({ data }: { data: readonly DashboardChartPoint[] }) {
  return <div className="chart-shell"><div className="chart-visual" role="img" aria-label="Grafik mock revenue, biaya, dan laba kotor Maret sampai Agustus 2026 dalam juta Rupiah"><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 12, right: 10, left: -12, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="period" tickLine={false}/><YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${v} Jt`}/><Tooltip formatter={(v) => formatRupiah(String(Number(v) * 1_000_000), true)}/><Legend/><Line type="monotone" dataKey="revenue" name="Revenue" stroke="#c79c2e" strokeWidth={3}/><Line type="monotone" dataKey="cost" name="Biaya" stroke="#526d7a" strokeWidth={2}/><Line type="monotone" dataKey="profit" name="Laba kotor" stroke="#247559" strokeWidth={2}/></LineChart></ResponsiveContainer></div><details className="chart-data"><summary>Lihat data grafik dalam tabel</summary><table><caption className="sr-only">Data kinerja keuangan mock</caption><thead><tr><th>Periode</th><th>Revenue</th><th>Biaya</th><th>Laba kotor</th></tr></thead><tbody>{data.map((row) => <tr key={row.period}><th scope="row">{row.period}</th><td>{row.revenue} Jt</td><td>{row.cost} Jt</td><td>{row.profit} Jt</td></tr>)}</tbody></table></details></div>;
}
