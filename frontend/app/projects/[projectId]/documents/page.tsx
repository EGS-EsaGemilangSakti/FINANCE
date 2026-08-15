import { DocumentListPage } from "@/features/documents/components/document-list-page";
export default async function Page({params}:{params:Promise<{projectId:string}>}){const {projectId}=await params;return <DocumentListPage projectId={projectId}/>;}
