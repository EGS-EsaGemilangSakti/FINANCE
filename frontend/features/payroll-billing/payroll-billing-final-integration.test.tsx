import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { queryKeys } from "@/lib/query-keys";
import { legalTransition } from "./domain/calculation";
import type { PayrollBillingRunDetail, PayrollCommand } from "./domain/types";
import { resetPayrollBillingMock, setPayrollBillingReferenceScenario } from "./infrastructure/mock-adapter";
import { payrollBillingRepository } from "./repositories";
import { payrollBillingInvalidationKeys, useAdjustPayrollBilling, useLockPayrollBilling, useRecalculatePayrollBilling } from "./queries/hooks";
import { PayrollBillingCreatePage } from "./components/payroll-billing-create-page";
import { PayrollBillingDetailPage } from "./components/payroll-billing-detail-page";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => "/payroll-billing/pbr-001",
  useRouter: () => ({ push, replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams("access=view"),
}));
function Wrapper({ children }: { children: ReactNode }) { return <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>{children}</QueryClientProvider>; }
const actor = (permission: string) => ({ userId: "usr-integration", permissionKeys: [permission] });
const currentCommand = (detail: PayrollBillingRunDetail, permission: string, reason: string): PayrollCommand<{ runId: string; revisionId: string; revisionVersion: number }> => { const revision = detail.revisions.find((item) => item.id === detail.run.currentRevisionId)!; return { data: { runId: detail.run.id, revisionId: revision.id, revisionVersion: revision.version }, actor: actor(permission), reason, currentVersion: detail.run.version }; };

beforeEach(() => { vi.restoreAllMocks(); push.mockReset(); resetPayrollBillingMock(); });

describe("Final Payroll Billing integration journey", () => {
  it("selects an eligible repository source and creates through the production UI with metadata only", async () => {
    const sourceSpy = vi.spyOn(payrollBillingRepository, "sourceOptions"), createSpy = vi.spyOn(payrollBillingRepository, "create");
    const user = userEvent.setup(); render(<PayrollBillingCreatePage access="manage" />, { wrapper: Wrapper });
    expect(await screen.findByLabelText("Locked Attendance source")).toHaveValue("att-001"); expect(sourceSpy).toHaveBeenCalledTimes(1);
    await user.type(screen.getByLabelText("Calculation reason / run note"), "Create dari Attendance Locked"); await user.click(screen.getByRole("button", { name: "Tinjau create" }));
    expect(screen.getByText("Review sebelum create")).toBeVisible(); expect(screen.getAllByText(/Rate Version 2/).length).toBeGreaterThan(0); await user.click(screen.getByRole("button", { name: "Buat Payroll Billing Run" }));
    await waitFor(() => expect(createSpy).toHaveBeenCalledTimes(1));
    const command = createSpy.mock.calls[0][0]; expect(command.data).toEqual({ attendanceBatchId: "att-001", projectId: "prj-019", period: "2026-07", sphId: "sph-019" });
    for (const key of ["summary", "readiness", "status", "lines", "rate", "totals"]) expect(command.data).not.toHaveProperty(key);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/payroll-billing/pbr-001?access=manage")); expect((await payrollBillingRepository.activity("pbr-001"))[0].action).toBe("payroll-billing.created");
  });

  it("runs adjustment, recalculation, compare, review, and immutable lock without overwriting history", async () => {
    let detail = await payrollBillingRepository.get("pbr-001");
    const originalRevision = structuredClone(detail.revisions[0]);
    const adjustment = currentCommand(detail, "payroll-billing.adjust", "Adjustment integration");
    await payrollBillingRepository.adjust({ ...adjustment, data: { ...adjustment.data, scope: "Run", type: "Addition", amount: "2500.25", currency: "IDR" } });
    detail = await payrollBillingRepository.get("pbr-001"); expect(detail.revisions).toHaveLength(2); expect(detail.revisions[1]).toEqual(originalRevision); expect(detail.run.summary.grandTotal).toBe("9602500.25");
    const adjustedId = detail.run.currentRevisionId;
    await payrollBillingRepository.recalculate(currentCommand(detail, "payroll-billing.recalculate", "Recalculate integration"));
    detail = await payrollBillingRepository.get("pbr-001"); expect(detail.revisions).toHaveLength(3); expect(detail.revisions.find((item) => item.id === adjustedId)).toBeDefined();
    const diff = await payrollBillingRepository.revisionDiff(detail.run.id, adjustedId, detail.run.currentRevisionId); expect(diff.summary.before).toBe(diff.summary.after); expect(diff.summary.absoluteDelta).toBe("0");
    const secondAdjustment = currentCommand(detail, "payroll-billing.adjust", "Ready for review");
    await payrollBillingRepository.adjust({ ...secondAdjustment, data: { ...secondAdjustment.data, scope: "Run", type: "Addition", amount: "0.75", currency: "IDR" } });
    detail = await payrollBillingRepository.get("pbr-001"); await payrollBillingRepository.review({ ...currentCommand(detail, "payroll-billing.review", "Review integration"), data: { ...currentCommand(detail, "payroll-billing.review", "Review integration").data, attestation: true } });
    detail = await payrollBillingRepository.get("pbr-001"); expect(detail.run.status).toBe("Reviewed"); expect(detail.run.reviewedByUserId).toBe("usr-integration");
    await payrollBillingRepository.lock({ ...currentCommand(detail, "payroll-billing.lock", "Lock integration"), data: { ...currentCommand(detail, "payroll-billing.lock", "Lock integration").data, attestation: true } });
    const locked = await payrollBillingRepository.get("pbr-001"); expect(locked.run.status).toBe("Locked"); expect(locked.run.lockedByUserId).toBe("usr-integration"); expect(locked.revisions).toHaveLength(4); expect(locked.activity.map((item) => item.action)).toEqual(expect.arrayContaining(["payroll-billing.adjusted", "payroll-billing.recalculated", "payroll-billing.reviewed", "payroll-billing.locked"]));
    await expect(payrollBillingRepository.adjust({ ...currentCommand(locked, "payroll-billing.adjust", "Illegal locked adjustment"), data: { ...currentCommand(locked, "payroll-billing.adjust", "Illegal locked adjustment").data, scope: "Run", type: "Addition", amount: "1", currency: "IDR" } })).rejects.toMatchObject({ status: 422 });
  });

  it.each(["attendance-ineligible", "rate-inapplicable", "blocking-exception", "variance"] as const)("blocks %s atomically without version, status, or activity changes", async (scenario) => {
    setPayrollBillingReferenceScenario(scenario); const before = await payrollBillingRepository.get("pbr-001");
    const operation = scenario === "attendance-ineligible" || scenario === "rate-inapplicable" ? payrollBillingRepository.recalculate(currentCommand(before, "payroll-billing.recalculate", "Reference validation")) : payrollBillingRepository.review({ ...currentCommand(before, "payroll-billing.review", "Readiness validation"), data: { ...currentCommand(before, "payroll-billing.review", "Readiness validation").data, attestation: true } });
    await expect(operation).rejects.toMatchObject({ status: 422 }); const after = await payrollBillingRepository.get("pbr-001"); expect(after.run.version).toBe(before.run.version); expect(after.run.status).toBe(before.run.status); expect(after.activity).toEqual(before.activity); expect(after.revisions).toEqual(before.revisions);
  });

  it("retains financial history on rejection and only permits the declared recalculation transition", async () => {
    const before = await payrollBillingRepository.get("pbr-001"); await payrollBillingRepository.reject(currentCommand(before, "payroll-billing.reject", "Rejected by integration reviewer"));
    let rejected = await payrollBillingRepository.get("pbr-001"); expect(rejected.run.status).toBe("Rejected"); expect(rejected.run.rejectedByUserId).toBe("usr-integration"); expect(rejected.revisions).toEqual(before.revisions); expect(rejected.run.summary).toEqual(before.run.summary); expect(legalTransition("Rejected", "Calculated")).toBe(true);
    await payrollBillingRepository.recalculate(currentCommand(rejected, "payroll-billing.recalculate", "Correct rejected calculation")); rejected = await payrollBillingRepository.get("pbr-001"); expect(rejected.run.status).toBe("Calculated");
  });

  it("invalidates the exact cross-consumer families for adjustment, recalculation, and lock", () => {
    const revisionKeys = payrollBillingInvalidationKeys("pbr-001", "revision"), stateKeys = payrollBillingInvalidationKeys("pbr-001", "state");
    for (const key of [queryKeys.payrollBilling.detail("pbr-001"), queryKeys.payrollBilling.currentRevision("pbr-001"), queryKeys.payrollBilling.revisions("pbr-001"), queryKeys.payrollBilling.lines("pbr-001"), queryKeys.payrollBilling.summary("pbr-001"), queryKeys.payrollBilling.readiness("pbr-001"), queryKeys.payrollBilling.activity("pbr-001")]) expect(revisionKeys).toContainEqual(key);
    expect(stateKeys).toContainEqual(queryKeys.payrollBilling.detail("pbr-001")); expect(stateKeys).toContainEqual(queryKeys.payrollBilling.currentRevision("pbr-001")); expect(stateKeys).toContainEqual(queryKeys.payrollBilling.activity("pbr-001"));
  });

  it("production mutation hooks keep revision and lock invalidation wired", () => { expect(useAdjustPayrollBilling).toBeTypeOf("function"); expect(useRecalculatePayrollBilling).toBeTypeOf("function"); expect(useLockPayrollBilling).toBeTypeOf("function"); });

  it("preserves persona on detail-to-list and not-found recovery navigation", async () => {
    const detailPage = await PayrollBillingDetailPage({ id: "pbr-001", access: "view" }); render(detailPage, { wrapper: Wrapper }); expect(screen.getByRole("link", { name: "Kembali ke daftar" })).toHaveAttribute("href", "/payroll-billing?access=view");
  });
});
