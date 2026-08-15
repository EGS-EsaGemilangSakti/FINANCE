import { z } from "zod";
import { AppError,isRequestCancellation } from "@/features/foundation/domain/errors";

const conflictSchema=z.object({userVersion:z.number(),latestVersion:z.number(),diffs:z.array(z.object({field:z.string(),label:z.string(),before:z.string(),after:z.string()}))});
export type DocumentFormField="title"|"category"|"description"|"reason"|"notes"|"file";
export type DocumentFieldErrors=Partial<Record<DocumentFormField,string>>;
export interface DocumentMutationErrorView{status:AppError["status"];code:string;message:string;fieldErrors:DocumentFieldErrors;globalErrors:readonly string[];retryable:boolean;correlationId:string;conflict?:z.infer<typeof conflictSchema>;}
const aliases:Readonly<Record<string,DocumentFormField>>={title:"title",category:"category",description:"description",reason:"reason",notes:"notes",file:"file",originalFileName:"file",mimeType:"file",sizeBytes:"file"};
export function mapDocumentMutationError(error:unknown):DocumentMutationErrorView{if(isRequestCancellation(error))throw error;const app=error instanceof AppError?error:new AppError(500,"UNEXPECTED_ERROR","Terjadi kendala internal. Coba kembali dengan ID korelasi.",{},true,"demo-unexpected-error"),fieldErrors:DocumentFieldErrors={},globalErrors:string[]=[];for(const [key,messages] of Object.entries(app.field_errors)){const field=aliases[key],message=messages[0];if(field&&message&&!fieldErrors[field])fieldErrors[field]=message;else if(message)globalErrors.push(message);}const conflict=conflictSchema.safeParse(app.metadata);return{status:app.status,code:app.code,message:app.message,fieldErrors,globalErrors,retryable:app.retryable,correlationId:app.correlation_id,conflict:conflict.success?conflict.data:undefined};}
