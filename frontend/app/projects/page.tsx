import type { Metadata } from "next";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { LoadingState } from "@/components/ui";
import { ProjectListPage } from "@/features/projects/components/project-list-page";
export const metadata:Metadata={title:"Project dan SPH | ESA Finance",description:"Daftar project, kontrak, dan readiness ESA Finance."};
export default function ProjectsPage(){return <AppShell><Suspense fallback={<LoadingState/>}><ProjectListPage/></Suspense></AppShell>;}
