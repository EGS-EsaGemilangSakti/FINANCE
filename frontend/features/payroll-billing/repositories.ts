import type { AdjustPayrollBillingCommand, CreatePayrollBillingCommand, LockPayrollBillingCommand, PaginatedResult, PayrollAuthoritativeReadiness, PayrollBillingActivity, PayrollBillingExceptionListItem, PayrollBillingExceptionQuery, PayrollBillingLine, PayrollBillingListQuery, PayrollBillingReadiness, PayrollBillingRevision, PayrollBillingRunDetail, PayrollBillingRunListItem, PayrollBillingSourceSnapshot, PayrollBillingSummary, PayrollCalculationTrace, PayrollMutationResult, PayrollRevisionDiff, RecalculatePayrollBillingCommand, RejectPayrollBillingCommand, ReviewPayrollBillingCommand } from "./domain/types";

export interface PayrollBillingRepository {
  list(query:PayrollBillingListQuery,signal?:AbortSignal):Promise<PaginatedResult<PayrollBillingRunListItem>>;
  get(id:string,signal?:AbortSignal):Promise<PayrollBillingRunDetail>;
  currentRevision(id:string,signal?:AbortSignal):Promise<PayrollBillingRevision>;
  revision(id:string,revisionId:string,signal?:AbortSignal):Promise<PayrollBillingRevision>;
  revisions(id:string,signal?:AbortSignal):Promise<readonly PayrollBillingRevision[]>;
  revisionLines(id:string,revisionId:string,signal?:AbortSignal):Promise<readonly PayrollBillingLine[]>;
  revisionSummary(id:string,revisionId:string,signal?:AbortSignal):Promise<PayrollBillingSummary>;
  revisionReconciliation(id:string,revisionId:string,signal?:AbortSignal):Promise<PayrollBillingRunDetail["reconciliation"]>;
  revisionDiff(id:string,sourceRevisionId:string,targetRevisionId:string,signal?:AbortSignal):Promise<PayrollRevisionDiff>;
  lines(id:string,signal?:AbortSignal):Promise<readonly PayrollBillingLine[]>;
  trace(id:string,lineId:string,signal?:AbortSignal):Promise<PayrollCalculationTrace>;
  summary(id:string,signal?:AbortSignal):Promise<PayrollBillingSummary>;
  exceptions(id:string,query:PayrollBillingExceptionQuery,signal?:AbortSignal):Promise<PaginatedResult<PayrollBillingExceptionListItem>>;
  readiness(id:string,signal?:AbortSignal):Promise<PayrollBillingReadiness|PayrollAuthoritativeReadiness>;
  reconciliation(id:string,signal?:AbortSignal):Promise<PayrollBillingRunDetail["reconciliation"]>;
  activity(id:string,signal?:AbortSignal):Promise<readonly PayrollBillingActivity[]>;
  sourceOptions(signal?:AbortSignal):Promise<readonly PayrollBillingSourceSnapshot[]>;
  create(command:CreatePayrollBillingCommand,signal?:AbortSignal):Promise<PayrollMutationResult>;
  adjust(command:AdjustPayrollBillingCommand,signal?:AbortSignal):Promise<PayrollMutationResult>;
  recalculate(command:RecalculatePayrollBillingCommand,signal?:AbortSignal):Promise<PayrollMutationResult>;
  review(command:ReviewPayrollBillingCommand,signal?:AbortSignal):Promise<PayrollMutationResult>;
  reject(command:RejectPayrollBillingCommand,signal?:AbortSignal):Promise<PayrollMutationResult>;
  lock(command:LockPayrollBillingCommand,signal?:AbortSignal):Promise<PayrollMutationResult>;
}
export {payrollBillingRepository} from "./infrastructure/mock-adapter";
