"use client";
import {useCallback,useEffect,useRef} from "react";
import {useMutation,useQuery,useQueryClient} from "@tanstack/react-query";
import {normalizeOrRethrowAppError} from "@/features/foundation/domain/errors";
import {queryKeys} from "@/lib/query-keys";
import {normalizeInvoiceListQuery} from "../domain/logic";
import type {InvoiceDraftCommand,InvoiceDraftMutationResult,InvoiceListQuery} from "../domain/types";
import type {RecordCustomerConfirmedCommand,RecordRevisionRequestCommand,RequestConfirmationCommand,ResubmitRevisionCommand,SaveRevisionCommand} from "../domain/types";
import {invoiceRepository as repository} from "../repositories";
const safe=async<T,>(operation:()=>Promise<T>)=>{try{return await operation();}catch(error){throw normalizeOrRethrowAppError(error);}};
const can=(access:string)=>access!=="none";
export const useInvoiceList=(query:InvoiceListQuery,access="view")=>{const normalized=normalizeInvoiceListQuery(query);return useQuery({queryKey:queryKeys.invoices.list(normalized),enabled:can(access),queryFn:({signal})=>safe(()=>repository.list(normalized,signal))});};
export const useInvoiceSourceOptions=(access:string)=>useQuery({queryKey:queryKeys.invoices.sourceOptions,enabled:access==="manage",queryFn:({signal})=>safe(()=>repository.sourceOptions(signal))});
export const useInvoiceDetail=(id:string,access:string)=>useQuery({queryKey:queryKeys.invoices.detail(id),enabled:can(access)&&Boolean(id),queryFn:({signal})=>safe(()=>repository.detail(id,signal))});
export const useInvoicePreview=(id:string,access:string,enabled=true)=>useQuery({queryKey:queryKeys.invoices.preview(id),enabled:enabled&&can(access)&&Boolean(id),queryFn:({signal})=>safe(()=>repository.preview(id,signal))});
type InvoiceQueryKey=readonly unknown[];
const common=(id:string)=>({list:queryKeys.invoices.lists,detail:queryKeys.invoices.detail(id),current:queryKeys.invoices.currentRevision(id),history:queryKeys.invoices.history(id),diffs:queryKeys.invoices.revisionDiffs(id),working:queryKeys.invoices.workingRevision(id),lines:queryKeys.invoices.lines(id),summary:queryKeys.invoices.summary(id),reconciliation:queryKeys.invoices.reconciliation(id),readiness:queryKeys.invoices.readiness(id),confirmationReadiness:queryKeys.invoices.confirmationReadiness(id),cycles:queryKeys.invoices.confirmationCycles(id),evidence:queryKeys.invoices.evidence(id),responses:queryKeys.invoices.customerResponses(id),requests:queryKeys.invoices.revisionRequests(id),preview:queryKeys.invoices.preview(id),activity:queryKeys.invoices.activity(id)});
export const invoiceMutationInvalidationKeys={
 create:(id:string):readonly InvoiceQueryKey[]=>{const k=common(id);return[k.list,k.detail,k.current,k.preview,k.activity,queryKeys.invoices.sourceOptions];},
 draftSave:(id:string):readonly InvoiceQueryKey[]=>{const k=common(id);return[k.detail,k.current,k.lines,k.summary,k.reconciliation,k.readiness,k.preview,k.activity];},
 draftAutosave:(id:string):readonly InvoiceQueryKey[]=>{const k=common(id);return[k.detail,k.current,k.lines,k.summary,k.reconciliation,k.readiness,k.preview];},
 request:(id:string):readonly InvoiceQueryKey[]=>{const k=common(id);return[k.list,k.detail,k.current,k.readiness,k.confirmationReadiness,k.preview,k.cycles,k.evidence,k.activity];},
 revisionRequest:(id:string):readonly InvoiceQueryKey[]=>{const k=common(id);return[k.list,k.detail,k.current,k.working,k.history,k.diffs,k.requests,k.readiness,k.confirmationReadiness,k.preview,k.cycles,k.evidence,k.activity];},
 revisionSave:(id:string):readonly InvoiceQueryKey[]=>{const k=common(id);return[k.detail,k.working,k.lines,k.summary,k.reconciliation,k.readiness,k.confirmationReadiness,k.diffs,k.requests,k.preview,k.activity];},
 revisionAutosave:(id:string):readonly InvoiceQueryKey[]=>{const k=common(id);return[k.detail,k.working,k.summary,k.reconciliation,k.readiness,k.confirmationReadiness,k.diffs,k.preview];},
 resubmit:(id:string):readonly InvoiceQueryKey[]=>{const k=common(id);return[k.list,k.detail,k.current,k.history,k.diffs,k.working,k.requests,k.readiness,k.confirmationReadiness,k.preview,k.cycles,k.evidence,k.activity];},
 confirmed:(id:string):readonly InvoiceQueryKey[]=>{const k=common(id);return[k.list,k.detail,k.current,k.readiness,k.confirmationReadiness,k.preview,k.cycles,k.evidence,k.responses,k.activity]},
}as const;
function useInvoiceMutation<T=InvoiceDraftCommand>(operation:(command:T,signal:AbortSignal)=>Promise<InvoiceDraftMutationResult>,keys:(id:string)=>readonly InvoiceQueryKey[],autosave=false){const client=useQueryClient(),controller=useRef<AbortController|null>(null),sequence=useRef(0);useEffect(()=>()=>controller.current?.abort(),[]);const mutation=useMutation<InvoiceDraftMutationResult,Error,T>({mutationFn:command=>{if(autosave)controller.current?.abort();const current=new AbortController();controller.current=current;const request=++sequence.current;return safe(()=>operation(command,current.signal)).then(result=>{if(autosave&&request!==sequence.current)throw new DOMException("Stale autosave","AbortError");return result;}).finally(()=>{if(controller.current===current)controller.current=null;});},onSuccess:result=>{for(const key of keys(result.invoiceId))void client.invalidateQueries({queryKey:key,exact:key!==queryKeys.invoices.lists&&key[3]!=="revision-diff"});}});const cancel=useCallback(()=>controller.current?.abort(),[]);return{...mutation,cancel};}
export const useCreateInvoiceDraft=()=>useInvoiceMutation((command,signal)=>repository.createDraft(command,signal),invoiceMutationInvalidationKeys.create);
export const useSaveInvoiceDraft=()=>useInvoiceMutation((command,signal)=>repository.saveDraft(command,signal),invoiceMutationInvalidationKeys.draftSave);
export const useAutosaveInvoiceDraft=()=>useInvoiceMutation((command,signal)=>repository.autosaveDraft(command,signal),invoiceMutationInvalidationKeys.draftAutosave,true);
export const useInvoiceConfirmationState=(id:string,access:string)=>useQuery({queryKey:queryKeys.invoices.confirmationCycles(id),enabled:access!=="none"&&Boolean(id),queryFn:({signal})=>safe(()=>repository.confirmationState(id,signal))});
export const useInvoiceRevisionDiff=(id:string,sourceId:string,targetId:string,access:string)=>useQuery({queryKey:queryKeys.invoices.revisionDiff(id,sourceId,targetId),enabled:access!=="none"&&sourceId!==targetId&&Boolean(id&&sourceId&&targetId),queryFn:({signal})=>safe(()=>repository.revisionDiff(id,sourceId,targetId,signal))});
export const useRequestInvoiceConfirmation=()=>useInvoiceMutation((command:RequestConfirmationCommand,signal)=>repository.requestConfirmation(command,signal),invoiceMutationInvalidationKeys.request);
export const useRecordInvoiceRevisionRequest=()=>useInvoiceMutation((command:RecordRevisionRequestCommand,signal)=>repository.recordRevisionRequest(command,signal),invoiceMutationInvalidationKeys.revisionRequest);
export const useSaveInvoiceRevision=()=>useInvoiceMutation((command:SaveRevisionCommand,signal)=>repository.saveRevision(command,signal),invoiceMutationInvalidationKeys.revisionSave);
export const useAutosaveInvoiceRevision=()=>useInvoiceMutation((command:SaveRevisionCommand,signal)=>repository.saveRevision(command,signal),invoiceMutationInvalidationKeys.revisionAutosave,true);
export const useResubmitInvoiceRevision=()=>useInvoiceMutation((command:ResubmitRevisionCommand,signal)=>repository.resubmitRevision(command,signal),invoiceMutationInvalidationKeys.resubmit);
export const useRecordCustomerConfirmed=()=>useInvoiceMutation((command:RecordCustomerConfirmedCommand,signal)=>repository.recordCustomerConfirmed(command,signal),invoiceMutationInvalidationKeys.confirmed);
