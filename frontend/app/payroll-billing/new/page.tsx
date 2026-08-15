import {PayrollBillingCreatePage} from "@/features/payroll-billing/components/payroll-billing-create-page";
export default async function Page({searchParams}:{searchParams:Promise<{access?:string}>}){const params=await searchParams;return <PayrollBillingCreatePage access={params.access}/>}
