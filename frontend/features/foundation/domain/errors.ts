export type FieldErrors = Readonly<Record<string, readonly string[]>>;
export type ErrorMetadata = Readonly<Record<string, unknown>>;
export type ErrorStatus = 400 | 401 | 403 | 404 | 409 | 422 | 500 | 502 | 503;
export interface AppErrorContract { status: ErrorStatus; code: string; message: string; field_errors: FieldErrors; retryable: boolean; correlation_id: string; metadata: ErrorMetadata; }
export class AppError extends Error implements AppErrorContract {
  constructor(public readonly status: ErrorStatus, public readonly code: string, message: string, public readonly field_errors: FieldErrors = {}, public readonly retryable = false, public readonly correlation_id = "demo-correlation-unavailable",public readonly metadata:ErrorMetadata={}) { super(message); this.name = "AppError"; }
}
export function normalizeAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  return new AppError(500, "UNEXPECTED_ERROR", "Terjadi kendala internal. Coba kembali atau hubungi dukungan dengan ID korelasi.", {}, true, "demo-unexpected-error");
}
export function isRequestCancellation(error: unknown): boolean { return error instanceof DOMException ? error.name === "AbortError" : typeof error === "object" && error !== null && "name" in error && error.name === "AbortError"; }
export function normalizeOrRethrowAppError(error: unknown): AppError { if (isRequestCancellation(error)) throw error; return normalizeAppError(error); }
