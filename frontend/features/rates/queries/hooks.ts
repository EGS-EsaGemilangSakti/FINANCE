"use client";
import { useMutation,useQuery,useQueryClient } from "@tanstack/react-query";
import { normalizeOrRethrowAppError,type AppError } from "@/features/foundation/domain/errors";
import { repositories } from "@/features/foundation/repositories";
import { queryKeys } from "@/lib/query-keys";
import { normalizeRateListQuery } from "../domain/logic";
import type { ActivateRateCommand,CreateRateDraftCommand,RateListQuery,RateListResult,RateMutationResult,RateVersion,RateVersionComparison,RateVersionDetail,UpdateRateDraftCommand } from "../domain/types";
const safe=async<T>(operation:()=>Promise<T>)=>{try{return await operation();}catch(error){throw normalizeOrRethrowAppError(error);}};
export function useRateList(projectId:string,params:RateListQuery,enabled=true){const normalized=normalizeRateListQuery(params);return useQuery<RateListResult,AppError>({queryKey:queryKeys.rates.list(projectId,normalized),enabled,queryFn:({signal})=>safe(()=>repositories.rates.list(projectId,normalized,signal))});}
export function useRateDetail(projectId:string,id:string,enabled=true){return useQuery<RateVersionDetail,AppError>({queryKey:queryKeys.rates.detail(projectId,id),enabled,queryFn:({signal})=>safe(()=>repositories.rates.getById(projectId,id,signal))});}
export function useCurrentRate(projectId:string,enabled=true){return useQuery<RateVersion|undefined,AppError>({queryKey:queryKeys.rates.current(projectId),enabled,queryFn:({signal})=>safe(()=>repositories.rates.getCurrentByProject(projectId,signal))});}
export function useRateComparison(projectId:string,id:string,sourceId:string|undefined,enabled=true){return useQuery<RateVersionComparison,AppError>({queryKey:queryKeys.rates.comparison(projectId,id,sourceId),enabled,queryFn:({signal})=>safe(()=>repositories.rates.getComparison(projectId,id,sourceId,signal))});}
export function rateInvalidationKeys(projectId:string,result:RateMutationResult){const keys=[queryKeys.rates.listRoot(projectId),queryKeys.rates.current(projectId),queryKeys.rates.detail(projectId,result.id),queryKeys.rates.comparisons(projectId,result.id),queryKeys.rates.impact(projectId,result.id),queryKeys.rates.readiness(projectId,result.id),queryKeys.audit.byObject("RateVersion",result.id),queryKeys.projects.readiness(projectId)];if(result.previousActiveId)keys.push(queryKeys.rates.detail(projectId,result.previousActiveId),queryKeys.audit.byObject("RateVersion",result.previousActiveId));return keys;}
function useRateMutation<T>(projectId:string,fn:(value:T)=>Promise<RateMutationResult>){const client=useQueryClient();return useMutation<RateMutationResult,AppError,T>({mutationFn:(value)=>safe(()=>fn(value)),onSuccess:async(result)=>{await Promise.all(rateInvalidationKeys(projectId,result).map((queryKey)=>client.invalidateQueries({queryKey})));}});}
export function useCreateRate(projectId:string){return useRateMutation<CreateRateDraftCommand>(projectId,(command)=>repositories.rates.createDraft(command));}
export function useUpdateRate(projectId:string){return useRateMutation<UpdateRateDraftCommand>(projectId,(command)=>repositories.rates.updateDraft(command));}
export function useActivateRate(projectId:string){return useRateMutation<ActivateRateCommand>(projectId,(command)=>repositories.rates.activate(command));}
