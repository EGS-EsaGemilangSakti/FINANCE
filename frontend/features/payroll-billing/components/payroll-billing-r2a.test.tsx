import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/features/foundation/domain/errors";
import type { PayrollBillingRunDetail } from "../domain/types";
import { resetPayrollBillingMock } from "../infrastructure/mock-adapter";
import { payrollBillingRepository } from "../repositories";
import { PayrollBillingActions } from "./payroll-billing-actions";
import { PayrollBillingCreatePage } from "./payroll-billing-create-page";
import { PayrollBillingDetailPage } from "./payroll-billing-detail-page";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>{children}</QueryClientProvider>;
let baseDetail: PayrollBillingRunDetail;
beforeEach(async () => { vi.restoreAllMocks(); push.mockReset(); resetPayrollBillingMock(); baseDetail = await payrollBillingRepository.get("pbr-001"); });

type FormAction = "Adjustment" | "Recalculate" | "Review" | "Reject" | "Lock";
const method: Record<FormAction, "adjust" | "recalculate" | "review" | "reject" | "lock"> = { Adjustment: "adjust", Recalculate: "recalculate", Review: "review", Reject: "reject", Lock: "lock" };
function detailFor(action: FormAction) {
  if (action !== "Lock") return baseDetail;
  return { ...baseDetail, run: { ...baseDetail.run, status: "Reviewed" as const, reviewedByUserId: "usr-reviewer", reviewedAt: "2026-08-01T09:00:00+07:00" }, readiness: { ...baseDetail.readiness, readyToLock: true } };
}
async function openAndFill(action: FormAction, reason = `${action} acceptance reason`) {
  const user = userEvent.setup();
  render(<PayrollBillingActions detail={detailFor(action)} access={action === "Adjustment" || action === "Recalculate" ? "manage" : "review"} />, { wrapper });
  await user.click(screen.getByRole("button", { name: action }));
  if (action === "Adjustment") {
    await user.selectOptions(screen.getByLabelText("Scope"), "Line");
    await user.selectOptions(screen.getByLabelText("Target line"), baseDetail.lines[0].id);
    await user.selectOptions(screen.getByLabelText("Type"), "Deduction");
    await user.type(screen.getByLabelText("Amount"), "1250.50");
    await user.type(screen.getByLabelText("Reason"), reason);
    await user.type(screen.getByLabelText("Supporting note"), "Bukti operasional tersedia");
  } else {
    await user.type(screen.getByLabelText(action === "Reject" ? "Reason penolakan" : "Comment / reason"), reason);
    if (action === "Review" || action === "Lock") await user.click(screen.getByLabelText(/Attestation:/));
  }
  return user;
}
async function submit(action: FormAction, user: ReturnType<typeof userEvent.setup>) {
  if (action === "Adjustment") { const review = screen.queryByRole("button", { name: "Tinjau adjustment" }); if (review) await user.click(review); await user.click(screen.getByRole("button", { name: "Konfirmasi adjustment" })); }
  else await user.click(screen.getAllByRole("button", { name: action }).at(-1)!);
}

describe("Payroll Billing R2A production mutation acceptance", () => {
  it("builds an isolated line adjustment command and preserves input when returning from review", async () => {
    const spy = vi.spyOn(payrollBillingRepository, "adjust");
    const user = await openAndFill("Adjustment");
    await user.click(screen.getByRole("button", { name: "Tinjau adjustment" }));
    expect(screen.getByRole("region", { name: "Review adjustment" })).toHaveTextContent("1250.50");
    await user.click(screen.getByRole("button", { name: "Kembali" }));
    expect(screen.getByLabelText("Reason")).toHaveValue("Adjustment acceptance reason");
    await user.click(screen.getByRole("button", { name: "Tinjau adjustment" }));
    await user.click(screen.getByRole("button", { name: "Konfirmasi adjustment" }));
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    const command = spy.mock.calls[0][0];
    expect(command).toEqual(expect.objectContaining({ data: expect.objectContaining({ runId: "pbr-001", revisionId: "rev-2", scope: "Line", lineId: baseDetail.lines[0].id, type: "Deduction", amount: "1250.50", currency: "IDR", note: "Bukti operasional tersedia" }), reason: "Adjustment acceptance reason", currentVersion: baseDetail.run.version }));
    for (const forbidden of ["summary", "snapshot", "readiness", "exceptionCount", "status", "lines"]) expect(command.data).not.toHaveProperty(forbidden);
  });

  it.each(["Adjustment", "Recalculate", "Review", "Reject", "Lock"] as const)("retains %s command through structured conflict and uses persona-safe recovery", async (action) => {
    const conflict = new AppError(409, "PAYROLL_BILLING_VERSION_CONFLICT", "Data berubah", {}, false, `corr-${action}`, { attemptedVersion: 2, latestVersion: 3, attemptedRevisionId: "rev-2", latestRevisionId: "rev-3", attemptedRevisionVersion: 1, latestRevisionVersion: 2, attemptedStatus: detailFor(action).run.status, latestStatus: "Locked", runId: "pbr-001" });
    const spy = vi.spyOn(payrollBillingRepository, method[action]).mockRejectedValue(conflict);
    const user = await openAndFill(action);
    await submit(action, user);
    const alert = await screen.findByRole("alert", { name: `Konflik ${action}` });
    expect(alert).toHaveFocus(); expect(alert).toHaveTextContent(`corr-${action}`); expect(spy).toHaveBeenCalledTimes(1);
    const access = action === "Adjustment" || action === "Recalculate" ? "manage" : "review";
    expect(screen.getByRole("link", { name: "Buka detail terbaru" })).toHaveAttribute("href", `/payroll-billing/pbr-001?access=${access}`);
    await user.click(screen.getByRole("button", { name: "Kembali ke form" }));
    expect(screen.getByLabelText(action === "Adjustment" ? "Reason" : action === "Reject" ? "Reason penolakan" : "Comment / reason")).toHaveValue(`${action} acceptance reason`);
    if (action === "Review" || action === "Lock") expect(screen.getByLabelText(/Attestation:/)).toBeChecked();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it.each(["Adjustment", "Recalculate", "Review", "Reject", "Lock"] as const)("retries %s with the identical command and a fresh signal", async (action) => {
    const success = { runId: "pbr-001", version: 3, revisionNumber: 3, message: "ok", correlationId: "corr-ok" };
    const spy = vi.spyOn(payrollBillingRepository, method[action]).mockRejectedValueOnce(new AppError(503, "PAYROLL_UNAVAILABLE", "internal", {}, true, `corr-503-${action}`)).mockResolvedValueOnce(success);
    const toastSpy = vi.spyOn(toast, "success");
    const user = await openAndFill(action);
    await submit(action, user);
    const retry = await screen.findByRole("button", { name: "Coba lagi" });
    expect(screen.getByText(`ID korelasi: corr-503-${action}`)).toBeVisible(); expect(toastSpy).not.toHaveBeenCalled();
    await user.click(retry);
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(2));
    expect(spy.mock.calls[1][0]).toEqual(spy.mock.calls[0][0]);
    expect(spy.mock.calls[1][1]).not.toBe(spy.mock.calls[0][1]);
    expect(toastSpy).toHaveBeenCalledTimes(1);
  });

  it.each(["Adjustment", "Recalculate", "Review", "Reject", "Lock"] as const)("consumes %s cancellation without false feedback and permits explicit resubmit", async (action) => {
    const spy = vi.spyOn(payrollBillingRepository, method[action]).mockRejectedValueOnce(new DOMException("cancelled", "AbortError")).mockResolvedValueOnce({ runId: "pbr-001", version: 3, revisionNumber: 3, message: "ok", correlationId: "corr-ok" });
    const toastSpy = vi.spyOn(toast, "success");
    const user = await openAndFill(action);
    await submit(action, user);
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(/belum berhasil/)).toBeNull(); expect(screen.queryByText(/ID korelasi/)).toBeNull(); expect(toastSpy).not.toHaveBeenCalled();
    await submit(action, user);
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(2));
    expect(spy.mock.calls[1][1]).not.toBe(spy.mock.calls[0][1]);
  });

  it.each((["Adjustment", "Recalculate", "Review", "Reject", "Lock"] as const).flatMap((action) => ([
    [action, 403, "PAYROLL_FORBIDDEN"], [action, 404, "PAYROLL_NOT_FOUND"], [action, 422, "PAYROLL_INVALID_STATE"],
  ] as const)))("keeps %s usable after non-retryable %s %s", async (action, status, code) => {
    const fieldErrors: Readonly<Record<string, readonly string[]>> = status === 422 ? { reason: ["State atau input tidak valid."] } : {};
    const spy = vi.spyOn(payrollBillingRepository, method[action]).mockRejectedValue(new AppError(status, code, "Permintaan tidak dapat diproses.", fieldErrors, false, `corr-${status}-${action}`));
    const toastSpy = vi.spyOn(toast, "success");
    const user = await openAndFill(action); await submit(action, user);
    expect(await screen.findByText(status === 422 ? "State atau input tidak valid." : "Permintaan tidak dapat diproses.")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Coba lagi" })).toBeNull(); expect(toastSpy).not.toHaveBeenCalled(); expect(spy).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText(action === "Adjustment" ? "Reason" : action === "Reject" ? "Reason penolakan" : "Comment / reason")).toHaveValue(`${action} acceptance reason`);
  });

  it.each(["Adjustment", "Recalculate", "Review", "Reject", "Lock"] as const)("prevents a concurrent double submit for %s", async (action) => {
    let settle: ((value: { runId: string; version: number; revisionNumber: number; message: string; correlationId: string }) => void) | undefined;
    const pending = new Promise<{ runId: string; version: number; revisionNumber: number; message: string; correlationId: string }>((resolve) => { settle = resolve; });
    const spy = vi.spyOn(payrollBillingRepository, method[action]).mockReturnValue(pending);
    const user = await openAndFill(action);
    await submit(action, user);
    const button = await screen.findByRole("button", { name: action === "Adjustment" ? /Menyimpan/ : /Memproses/ });
    expect(button).toBeDisabled(); await user.click(button); expect(spy).toHaveBeenCalledTimes(1);
    settle?.({ runId: "pbr-001", version: 3, revisionNumber: 3, message: "ok", correlationId: "corr-ok" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("maps field 422 to accessible input and keeps unknown fields global", async () => {
    vi.spyOn(payrollBillingRepository, "adjust").mockRejectedValue(new AppError(422, "VALIDATION_FAILED", "Input tidak valid", { amount: ["Amount ditolak server."], internalRule: ["Referensi server tidak cocok."] }, false, "corr-422"));
    const user = await openAndFill("Adjustment"); await submit("Adjustment", user);
    const amount = await screen.findByLabelText("Amount");
    expect(amount).toHaveAttribute("aria-invalid", "true"); expect(amount).toHaveAttribute("aria-describedby", "adjustment-amount-error");
    expect(screen.getByText("Amount ditolak server.")).toHaveAttribute("id", "adjustment-amount-error"); expect(screen.getByText("Referensi server tidak cocok.")).toBeVisible();
  });

  it("guards every dirty form and leaves pristine forms without confirmation", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    let user = await openAndFill("Reject"); await user.click(screen.getByRole("button", { name: "Batal" })); expect(confirm).toHaveBeenCalledTimes(1); expect(screen.getByLabelText("Reason penolakan")).toHaveValue("Reject acceptance reason");
    confirm.mockClear(); document.body.innerHTML = "";
    user = userEvent.setup(); render(<PayrollBillingActions detail={baseDetail} access="review" />, { wrapper }); await user.click(screen.getByRole("button", { name: "Reject" })); await user.click(screen.getByRole("button", { name: "Batal" })); expect(confirm).not.toHaveBeenCalled();
  });

  it.each(["Adjustment", "Recalculate", "Review", "Reject", "Lock"] as const)("keeps dirty %s state when close is declined", async (action) => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = await openAndFill(action); await user.click(screen.getByRole("button", { name: "Batal" }));
    expect(confirm).toHaveBeenCalledTimes(1); expect(screen.getByRole("dialog")).toBeVisible();
    expect(screen.getByLabelText(action === "Adjustment" ? "Reason" : action === "Reject" ? "Reason penolakan" : "Comment / reason")).toHaveValue(`${action} acceptance reason`);
  });

  it("suppresses sensitive detail fetch and mutation UI for the none persona", async () => {
    const get = vi.spyOn(payrollBillingRepository, "get");
    render(await PayrollBillingDetailPage({ id: "pbr-001", access: "none" }));
    expect(screen.getByText("Payroll Billing tidak diizinkan")).toBeVisible(); expect(get).not.toHaveBeenCalled(); expect(screen.queryByLabelText("Tindakan Payroll Billing")).toBeNull();
  });

  it.each(["view", "review", "none"])("denies direct create UI and repository access for %s", (access) => {
    const spy = vi.spyOn(payrollBillingRepository, "create"); render(<PayrollBillingCreatePage access={access} />);
    expect(screen.getByText("Create Payroll Billing tidak diizinkan")).toBeVisible(); expect(screen.queryByRole("button", { name: "Tinjau create" })).toBeNull(); expect(spy).not.toHaveBeenCalled();
  });
});
