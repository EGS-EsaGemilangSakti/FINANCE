import {PayrollBillingDetailPage} from "@/features/payroll-billing/components/payroll-billing-detail-page";
export default async function Page({params,searchParams}:{params:Promise<{runId:string}>;searchParams:Promise<{access?:string}>}){const [{runId},query]=await Promise.all([params,searchParams]);return <PayrollBillingDetailPage id={runId} access={query.access}/>}
