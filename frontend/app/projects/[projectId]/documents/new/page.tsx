import { DocumentUploadForm } from "@/features/documents/components/document-upload-form";
export default async function Page({params}:{params:Promise<{projectId:string}>}){const {projectId}=await params;return <DocumentUploadForm mode="create" projectId={projectId}/>;}
