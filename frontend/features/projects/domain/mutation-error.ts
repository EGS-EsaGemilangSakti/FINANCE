import { AppError,isRequestCancellation } from "@/features/foundation/domain/errors";

export interface ProjectMutationErrorView { fieldErrors: AppError["field_errors"]; conflict: boolean; retryable: boolean; message: string; correlationId: string; }

export function projectMutationError(error:unknown):ProjectMutationErrorView{
  if(isRequestCancellation(error))throw error;
  if(!(error instanceof AppError))throw error;
  return{fieldErrors:error.field_errors,conflict:error.status===409,retryable:error.retryable,message:error.message,correlationId:error.correlation_id};
}
