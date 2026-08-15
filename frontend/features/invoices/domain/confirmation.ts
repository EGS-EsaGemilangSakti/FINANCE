import Decimal from "decimal.js";
import { AppError } from "@/features/foundation/domain/errors";
import type { InvoiceDetail, InvoiceRevision, InvoiceRevisionDiff, InvoiceStatus } from "./types";
export const legalInvoiceTransition=(from:InvoiceStatus,to:InvoiceStatus)=>from==="Draft"&&to==="Pending Customer"||from==="Pending Customer"&&(to==="Revision"||to==="Pending Approval")||from==="Revision"&&to==="Pending Customer";
export function assertConfirmationReady(detail:InvoiceDetail){const blockers:string[]=[];if(!detail.reconciliation.reconciled||!new Decimal(detail.reconciliation.variance).eq(0))blockers.push("Reconciliation variance harus nol.");if(!detail.reconciliation.singleSph)blockers.push("Invoice harus menggunakan satu SPH.");if(!detail.reconciliation.currencyConsistent)blockers.push("Currency harus konsisten.");if(!detail.reconciliation.allSourceLinesMapped)blockers.push("Semua source line harus terpetakan.");if(!detail.revision.snapshot.invoiceDate)blockers.push("Draft date wajib diisi.");if(blockers.length)throw new AppError(422,"INVOICE_CONFIRMATION_NOT_READY","Invoice belum siap dikirim ke customer.",{readiness:blockers});}
export function invoiceRevisionDiff(source:InvoiceRevision,target:InvoiceRevision):InvoiceRevisionDiff{
 const changes:Array<InvoiceRevisionDiff["changes"][number]>=[];
 if(source.snapshot.note!==target.snapshot.note)changes.push({field:"note",kind:"Changed",before:source.snapshot.note,after:target.snapshot.note});
 for(const line of target.snapshot.lines){const before=source.snapshot.lines.find(item=>item.id===line.id);if(!before)changes.push({field:`line.${line.id}`,kind:"Added",after:line.description});else if(before.description!==line.description)changes.push({field:`line.${line.id}.description`,kind:"Changed",before:before.description,after:line.description});}
 for(const line of source.snapshot.lines)if(!target.snapshot.lines.some(item=>item.id===line.id))changes.push({field:`line.${line.id}`,kind:"Removed",before:line.description});
 const before=new Decimal(source.snapshot.summary.grandTotal),after=new Decimal(target.snapshot.summary.grandTotal),delta=after.minus(before);
 return{sourceRevisionId:source.id,targetRevisionId:target.id,changes,grandTotalBefore:before.toFixed(2),grandTotalAfter:after.toFixed(2),absoluteDelta:delta.toFixed(2),percentageDelta:before.eq(0)?undefined:delta.div(before).mul(100).toFixed(2),denominatorZero:before.eq(0),reconciledBefore:source.snapshot.reconciliation.reconciled,reconciledAfter:target.snapshot.reconciliation.reconciled};
}
