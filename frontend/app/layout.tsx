import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ESA Finance | Project Operations",
  description: "Sistem finance dan project operations terintegrasi PT Esa Gemilang Sakti",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="id"><body>{children}</body></html>;
}
