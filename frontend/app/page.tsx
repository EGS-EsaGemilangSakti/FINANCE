import { AppShell } from "@/components/layout/app-shell";
import { Dashboard } from "@/features/dashboard/dashboard";

export default function Home() {
  return <AppShell><Dashboard /></AppShell>;
}
