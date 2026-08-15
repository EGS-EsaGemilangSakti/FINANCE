import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/features/foundation/domain/errors";
import type { PayrollBillingRevision, PayrollBillingRunDetail, PayrollRevisionDiff } from "../domain/types";
import { resetPayrollBillingMock } from "../infrastructure/mock-adapter";
import { payrollBillingRepository } from "../repositories";
import { PayrollRevisionWorkspace } from "./payroll-revision-workspace";
import { PayrollCalculationTrace } from "./payroll-calculation-trace";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }), usePathname: () => "/payroll-billing/pbr-001", useSearchParams: () => new URLSearchParams("access=view") }));
function QueryWrapper({ children }: { children: ReactNode }) { return <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>; }
const makeWrapper = () => QueryWrapper;
let detail: PayrollBillingRunDetail;
beforeEach(async () => { vi.restoreAllMocks(); resetPayrollBillingMock(); detail = await payrollBillingRepository.get("pbr-001"); const current = detail.revisions[0]; await payrollBillingRepository.recalculate({ data: { runId: detail.run.id, revisionId: current.id, revisionVersion: current.version }, actor: { userId: "usr-test", permissionKeys: ["payroll-billing.recalculate"] }, reason: "R2B historical fixture", currentVersion: detail.run.version }); detail = await payrollBillingRepository.get("pbr-001"); });
const renderWorkspace = (access = "view") => render(<PayrollRevisionWorkspace detail={detail} access={access} />, { wrapper: makeWrapper() });

describe("Payroll Billing R2B Revision Workspace", () => {
  it("renders local history loading while workspace siblings remain available", async () => {
    let resolve: ((value: readonly PayrollBillingRevision[]) => void) | undefined;
    vi.spyOn(payrollBillingRepository, "revisions").mockReturnValue(new Promise((done) => { resolve = done; }));
    const view = renderWorkspace(); expect(screen.getByRole("status", { name: "Memuat revision history" })).toBeVisible(); expect(screen.getByLabelText("Revision sumber")).toBeVisible();
    resolve?.(detail.revisions); await waitFor(() => expect(screen.getByLabelText("Revision history")).toBeVisible()); view.unmount();
  });

  it("handles an authoritative empty history without synthetic revision or compare", async () => {
    vi.spyOn(payrollBillingRepository, "revisions").mockResolvedValue([]); renderWorkspace();
    expect(await screen.findByText("Revision history tidak tersedia")).toBeVisible(); expect(screen.queryByRole("button", { name: "Bandingkan revision" })).toBeNull();
  });

  it.each([[403, "PAYROLL_REVISION_FORBIDDEN", false], [404, "PAYROLL_REVISION_NOT_FOUND", false], [503, "PAYROLL_REVISION_UNAVAILABLE", true]] as const)("isolates history %s and exposes retry only when retryable", async (status, code, retryable) => {
    const spy = vi.spyOn(payrollBillingRepository, "revisions").mockRejectedValueOnce(new AppError(status, code, "Revision tidak tersedia.", {}, retryable, `corr-${status}`)).mockResolvedValueOnce(detail.revisions);
    const user = userEvent.setup(); renderWorkspace(); expect(await screen.findByText("Revision history belum dapat dimuat")).toBeVisible(); expect(screen.getByText(`ID korelasi: corr-${status}`)).toBeVisible();
    const retry = screen.queryByRole("button", { name: "Coba lagi" }); expect(Boolean(retry)).toBe(retryable); expect(screen.getByLabelText("Revision sumber")).toBeVisible();
    if (retry) { await user.click(retry); await waitFor(() => expect(spy).toHaveBeenCalledTimes(2)); }
  });

  it("uses current target and valid predecessor source without synthetic IDs", async () => {
    renderWorkspace(); expect(await screen.findByLabelText("Revision history")).toBeVisible();
    expect(screen.getByLabelText("Revision target")).toHaveValue(detail.run.currentRevisionId); expect(screen.getByLabelText("Revision sumber")).toHaveValue(detail.revisions[1].id);
    expect(screen.getAllByText(/Current/).length).toBeGreaterThan(0); expect(screen.getAllByText(/Historical read-only/).length).toBeGreaterThan(0);
  });

  it("disables compare for a single revision and explains the missing pair", async () => {
    detail = { ...detail, revisions: [detail.revisions[0]] };
    vi.spyOn(payrollBillingRepository, "revisions").mockResolvedValue(detail.revisions); renderWorkspace();
    expect(await screen.findByText("Belum ada dua revision untuk dibandingkan")).toBeVisible(); expect(screen.queryByRole("button", { name: "Bandingkan revision" })).toBeNull();
  });

  it("does not query workspace data for persona none", () => {
    const history = vi.spyOn(payrollBillingRepository, "revisions"), revision = vi.spyOn(payrollBillingRepository, "revision"), diff = vi.spyOn(payrollBillingRepository, "revisionDiff");
    renderWorkspace("none"); expect(screen.getByText("Revision Workspace tidak diizinkan")).toBeVisible(); expect(history).not.toHaveBeenCalled(); expect(revision).not.toHaveBeenCalled(); expect(diff).not.toHaveBeenCalled();
  });

  it("keeps source and target detail failures isolated", async () => {
    vi.spyOn(payrollBillingRepository, "revision").mockImplementation(async (_runId, revisionId) => { if (revisionId === detail.revisions[1].id) throw new AppError(404, "SOURCE_NOT_FOUND", "Source hilang", {}, false, "corr-source"); return detail.revisions[0]; });
    renderWorkspace(); expect(await screen.findByText("Revision sumber belum dapat dimuat")).toBeVisible(); expect(screen.getByRole("heading", { name: "Revision target" })).toBeVisible(); expect(screen.getAllByText(/Grand total/).length).toBeGreaterThan(0);
  });

  it("shows no-change diff as a successful authoritative state", async () => {
    const base = await payrollBillingRepository.revisionDiff("pbr-001", detail.revisions[1].id, detail.revisions[0].id);
    const unchanged: PayrollRevisionDiff = { ...base, addedLines: [], removedLines: [], changedLines: [], summary: { ...base.summary, before: "1.00", after: "1.00", absoluteDelta: "0.00", percentageDelta: "0", denominatorZero: false } };
    vi.spyOn(payrollBillingRepository, "revisionDiff").mockResolvedValue(unchanged); renderWorkspace(); expect(await screen.findByText("Tidak ada perubahan")).toBeVisible(); expect(screen.getByText(/Added 0, Removed 0, Changed 0/)).toBeVisible();
  });

  it("renders accessible full diff table and equivalent mobile cards", async () => {
    renderWorkspace(); const table = await screen.findByRole("table", { name: "Changed lines antar revision" });
    expect(table).toBeVisible(); expect(screen.getByRole("columnheader", { name: "Quantity before / after" })).toBeVisible(); expect(screen.getByLabelText("Changed lines mobile")).toBeInTheDocument();
    expect(screen.getByText(/Added lines:/)).toBeVisible(); expect(screen.getByText(/Removed lines:/)).toBeVisible(); expect(screen.getByText(/Absolute delta/)).toBeVisible();
  });

  it("keeps selection stable until explicit compare and focuses the result", async () => {
    const user = userEvent.setup(); renderWorkspace(); await screen.findByLabelText("Revision history");
    await user.selectOptions(screen.getByLabelText("Revision sumber"), detail.revisions[0].id); expect(screen.getByRole("button", { name: "Bandingkan revision" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Kembali ke pasangan current" })); await user.click(screen.getByRole("button", { name: "Bandingkan revision" }));
    const result = document.querySelector<HTMLElement>(".revision-result"); expect(result).not.toBeNull(); await waitFor(() => expect(result).toHaveFocus());
  });

  it("aborts pending history on unmount and gives a fresh mount a new signal", async () => {
    const signals: AbortSignal[] = [];
    vi.spyOn(payrollBillingRepository, "revisions").mockImplementation((_id, signal) => { signals.push(signal!); return new Promise((_resolve, reject) => signal?.addEventListener("abort", () => reject(new DOMException("stop", "AbortError")), { once: true })); });
    const first = renderWorkspace(); await waitFor(() => expect(signals).toHaveLength(1)); first.unmount(); expect(signals[0].aborted).toBe(true);
    const second = renderWorkspace(); await waitFor(() => expect(signals).toHaveLength(2)); expect(signals[1]).not.toBe(signals[0]); second.unmount();
  });
});

describe("Payroll Billing R2B responsive contracts", () => {
  it("provides desktop and mobile calculated-line and revision alternatives", async () => {
    const { PayrollBillingDetailPage } = await import("./payroll-billing-detail-page");
    render(await PayrollBillingDetailPage({ id: "pbr-001", access: "view" }), { wrapper: makeWrapper() });
    expect(screen.getByRole("table", { name: "Calculated payroll billing lines" })).toBeVisible(); expect(screen.getByLabelText("Calculated lines mobile")).toBeInTheDocument(); expect(await screen.findByLabelText("Changed lines mobile")).toBeInTheDocument(); expect(await screen.findByLabelText("Exception mobile")).toBeInTheDocument();
  });

  it("uses viewport-safe semantic structures for actions, tables and trace drawer", async () => {
    render(<><div className="action-bar" aria-label="Responsive actions"><button>Action</button></div><PayrollCalculationTrace lines={detail.lines} currency="IDR" /></>);
    expect(screen.getByLabelText("Responsive actions")).toHaveClass("action-bar"); await userEvent.setup().click(screen.getAllByRole("button", { name: /Jelaskan/ })[0]);
    expect(screen.getByRole("dialog")).toHaveClass("drawer"); expect(screen.getByRole("dialog")).toHaveTextContent("Formula metadata");
  });
});
