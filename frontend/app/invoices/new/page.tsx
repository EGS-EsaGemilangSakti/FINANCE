import {InvoiceCreatePage} from "@/features/invoices/components/invoice-create-page";
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){const query=await searchParams;return <InvoiceCreatePage access={typeof query.access==="string"?query.access:"manage"}/>;}
