import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/features/foundation/domain/errors";
import { AdminFormPage } from "./admin-form-page";

const state = vi.hoisted(() => ({ role: "ready" as "ready" | "loading" | "empty" | "403" | "503" | "cancel", catalog: "ready" as "ready" | "loading" | "empty" | "403" | "503" | "cancel", roleRetry: vi.fn(), catalogRetry: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }), useSearchParams: () => new URLSearchParams("access=manage") }));
vi.mock("../permissions/demo-access", () => ({ useAccessPersona: () => ({ access: "manage", canView: true, canManage: true, actor: { userId: "usr-dewi", permissionKeys: ["access.manage"] }, url: (path: string) => `${path}?access=manage` }) }));
vi.mock("../queries/hooks", () => {
  const base = { isPending: false, isError: false, error: null, refetch: vi.fn() };
  const dependency = (mode: typeof state.role, retry: ReturnType<typeof vi.fn>, data: unknown) => mode === "loading" ? { ...base, data: undefined, isPending: true } : mode === "empty" ? { ...base, data: Array.isArray(data) ? [] : { items: [], total: 0, page: 1, pageSize: 50, hasNextPage: false } } : mode === "403" ? { ...base, data: undefined, isError: true, error: new AppError(403, "FORBIDDEN", "Dilarang.", {}, false, "corr-403"), refetch: retry } : mode === "503" ? { ...base, data: undefined, isError: true, error: new AppError(503, "UNAVAILABLE", "Layanan belum tersedia.", {}, true, "corr-503"), refetch: retry } : mode === "cancel" ? { ...base, data: undefined, isPending: true } : { ...base, data };
  return { useAccessUser: () => ({ ...base, data: undefined }), useAccessRole: () => ({ ...base, data: undefined }), useAccessRoles: () => dependency(state.role, state.roleRetry, { items: [{ id: "role-view", code: "VIEW", name: "Viewer", description: "View", status: "Active", permissionKeys: ["access.view"], isSystem: false, createdAt: "2026-08-10T00:00:00+07:00", updatedAt: "2026-08-10T00:00:00+07:00", version: 1, userCount: 0, sodFindings: [] }], total: 1, page: 1, pageSize: 50, hasNextPage: false }), usePermissionCatalog: () => dependency(state.catalog, state.catalogRetry, [{ key: "access.view", module: "Access", label: "Lihat", description: "Lihat", risk: "Sensitive" }]), useSaveUser: () => ({ mutateAsync: vi.fn(), isPending: false }), useSaveRole: () => ({ mutateAsync: vi.fn(), isPending: false }) };
});

beforeEach(() => { state.role = "ready"; state.catalog = "ready"; state.roleRetry.mockReset(); state.catalogRetry.mockReset(); });

describe("User Form role dependency", () => {
  it("distinguishes loading and cancellation from an authoritative empty list", () => { state.role = "loading"; const view = render(<AdminFormPage kind="users" mode="create" />); expect(screen.getByLabelText("Memuat data")).toBeVisible(); view.unmount(); state.role = "cancel"; render(<AdminFormPage kind="users" mode="create" />); expect(screen.getByLabelText("Memuat data")).toBeVisible(); expect(screen.queryByText(/tidak dapat dimuat/i)).not.toBeInTheDocument(); });
  it("blocks the form when the valid role list is empty", () => { state.role = "empty"; render(<AdminFormPage kind="users" mode="create" />); expect(screen.getByText("Belum ada role aktif")).toBeVisible(); expect(screen.queryByRole("button", { name: "Tinjau perubahan" })).not.toBeInTheDocument(); });
  it("renders local denied and retryable server states", async () => { state.role = "403"; const view = render(<AdminFormPage kind="users" mode="create" />); expect(screen.getByText("Daftar role tidak dapat dimuat")).toBeVisible(); expect(screen.queryByRole("button", { name: /Coba lagi/ })).not.toBeInTheDocument(); view.unmount(); state.role = "503"; render(<AdminFormPage kind="users" mode="create" />); await userEvent.click(screen.getByRole("button", { name: "Coba lagi role" })); expect(state.roleRetry).toHaveBeenCalledOnce(); });
});

describe("Role Form permission dependency", () => {
  it("distinguishes loading and a valid empty catalog", () => { state.catalog = "loading"; const view = render(<AdminFormPage kind="roles" mode="create" />); expect(screen.getByLabelText("Memuat data")).toBeVisible(); view.unmount(); state.catalog = "empty"; render(<AdminFormPage kind="roles" mode="create" />); expect(screen.getByText("Katalog permission kosong")).toBeVisible(); expect(screen.queryByRole("button", { name: "Tinjau perubahan" })).not.toBeInTheDocument(); });
  it("renders denied and retries only retryable catalog errors", async () => { state.catalog = "403"; const view = render(<AdminFormPage kind="roles" mode="create" />); expect(screen.getByText("Katalog permission tidak dapat dimuat")).toBeVisible(); expect(screen.queryByRole("button", { name: /Coba lagi/ })).not.toBeInTheDocument(); view.unmount(); state.catalog = "503"; render(<AdminFormPage kind="roles" mode="create" />); await userEvent.click(screen.getByRole("button", { name: "Coba lagi katalog" })); expect(state.catalogRetry).toHaveBeenCalledOnce(); });
});
