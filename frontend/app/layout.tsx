import type { Metadata } from "next";
export const dynamic="force-dynamic";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import "@fortawesome/fontawesome-svg-core/styles.css";

const sans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ESA Finance | Project Operations",
  description: "Sistem finance dan project operations terintegrasi PT Esa Gemilang Sakti",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id">
      <body className={`${sans.variable} ${mono.variable}`}><a className="skip-link" href="#main-content">Lewati ke konten utama</a><AppProviders>{children}</AppProviders></body>
    </html>
  );
}
