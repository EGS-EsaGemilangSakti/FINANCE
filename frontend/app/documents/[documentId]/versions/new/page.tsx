import { DocumentUploadForm } from "@/features/documents/components/document-upload-form";
export default async function Page({params}:{params:Promise<{documentId:string}>}){const {documentId}=await params;return <DocumentUploadForm mode="version" documentId={documentId}/>;}
