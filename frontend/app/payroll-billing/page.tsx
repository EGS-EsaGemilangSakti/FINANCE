import {PayrollBillingListPage} from "@/features/payroll-billing/components/payroll-billing-list-page";
export default async function Page({searchParams}:{searchParams:Promise<{access?:string;search?:string}>}){const params=await searchParams;return <PayrollBillingListPage access={params.access} search={params.search}/>}
