import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminDetailPage } from "./admin-detail-page";
import { AdminFormPage } from "./admin-form-page";
import { AdminListPage } from "./admin-list-page";

let persona: "manage" | "view" | "none" = "manage";
let search = "access=manage";
const replace = vi.fn(), push = vi.fn();
const role = { id: "role-admin", code: "ADMIN_ACCESS", name: "Access Administrator", description: "Admin", status: "Active" as const, permissionKeys: ["access.view", "access.manage", "project.view"] as const, isSystem: true, createdAt: "2026-08-10T10:00:00+07:00", updatedAt: "2026-08-10T10:00:00+07:00", version: 2 };
const user = { id: "usr-dewi", employeeId: "EMP-001", name: "Dewi Sari", email: "dewi@example.test", status: "Active" as const, roleIds: [role.id], projectScopeIds: [], createdAt: role.createdAt, updatedAt: role.updatedAt, version: 2 };

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, push, refresh: vi.fn() }), usePathname: () => "/admin/users", useSearchParams: () => new URLSearchParams(search) }));
vi.mock("../permissions/demo-access", () => ({ useAccessPersona: () => ({ access: persona, canView: persona !== "none", canManage: persona === "manage", actor: { userId: "usr-dewi", permissionKeys: persona === "manage" ? ["access.view", "access.manage"] : persona === "view" ? ["access.view"] : [] }, url: (path: string) => `${path}${path.includes("?") ? "&" : "?"}access=${persona}` }) }));
vi.mock("../queries/hooks", () => { const q = <T,>(data: T) => ({ data, isPending: false, isError: false, error: null, refetch: vi.fn() }); const r = { id: "role-admin", code: "ADMIN_ACCESS", name: "Access Administrator", description: "Admin", status: "Active", permissionKeys: ["access.view", "access.manage", "project.view"], isSystem: true, createdAt: "2026-08-10T10:00:00+07:00", updatedAt: "2026-08-10T10:00:00+07:00", version: 2 }; const u = { id: "usr-dewi", employeeId: "EMP-001", name: "Dewi Sari", email: "dewi@example.test", status: "Active", roleIds: [r.id], projectScopeIds: [], createdAt: r.createdAt, updatedAt: r.updatedAt, version: 2 }; return {
  useAccessUsers: (_input: unknown, enabled: boolean) => { const item = { id: "usr-dewi", employeeId: "EMP-001", name: "Dewi Sari", email: "dewi@example.test", status: "Active", roleIds: ["role-admin"], projectScopeIds: [], createdAt: "2026-08-10T10:00:00+07:00", updatedAt: "2026-08-10T10:00:00+07:00", version: 2, roleNames: ["Access Administrator"], effectivePermissions: ["access.view", "access.manage", "project.view"] }; return enabled ? { data: { items: [item], total: 1, page: 1, pageSize: 20, hasNextPage: false }, isPending: false, isError: false, error: null, refetch: vi.fn() } : { data: undefined, isPending: false, isError: false, error: null, refetch: vi.fn() }; },
  useAccessRoles: (_input: unknown, enabled: boolean) => { const item = { id: "role-admin", code: "ADMIN_ACCESS", name: "Access Administrator", description: "Admin", status: "Active", permissionKeys: ["access.view", "access.manage", "project.view"], isSystem: true, createdAt: "2026-08-10T10:00:00+07:00", updatedAt: "2026-08-10T10:00:00+07:00", version: 2, userCount: 1, sodFindings: [] }; return enabled ? { data: { items: [item], total: 1, page: 1, pageSize: 20, hasNextPage: false }, isPending: false, isError: false, error: null, refetch: vi.fn() } : { data: undefined, isPending: false, isError: false, error: null, refetch: vi.fn() }; },
  useAccessUser: (_id: string, enabled: boolean) => enabled ? q({ user: u, roles: [r], effectivePermissions: r.permissionKeys, sodFindings: [], audit: [] }) : q(undefined),
  useAccessRole: (_id: string, enabled: boolean) => enabled ? q({ role: r, userCount: 1, sodFindings: [], audit: [] }) : q(undefined),
  usePermissionCatalog: () => q([{ key: "access.view", module: "Access", label: "Lihat", description: "Lihat akses", risk: "Sensitive" }, { key: "access.manage", module: "Access", label: "Kelola", description: "Kelola akses", risk: "Critical" }, { key: "pic.approve", module: "Approval", label: "Approval PIC", description: "Final approval", risk: "Critical" }]),
  useUserAudit: (_id: string, enabled: boolean) => enabled ? q([{ id: "audit-1", actorUserId: "usr-missing", action: "user.updated", objectType: "User", objectId: u.id, occurredAt: u.updatedAt, reason: "Perubahan role", correlationId: "corr-audit" }]) : q([]),
  useRoleAudit: () => q([]), useSaveUser: () => ({ mutateAsync: vi.fn(), isPending: false, cancel: vi.fn() }), useSaveRole: () => ({ mutateAsync: vi.fn(), isPending: false, cancel: vi.fn() }), useUserLifecycle: () => ({ mutateAsync: vi.fn(), isPending: false, cancel: vi.fn() }), useRoleLifecycle: () => ({ mutateAsync: vi.fn(), isPending: false, cancel: vi.fn() }),
}; });

beforeEach(() => { persona = "manage"; search = "access=manage"; replace.mockReset(); push.mockReset(); });

describe("AdminListPage production integration", () => {
  it("renders semantic table, role filter, sortable header, column control and persona links", () => { render(<AdminListPage kind="users" />); expect(screen.getByRole("table", { name: /Daftar pengguna/ })).toBeVisible(); expect(screen.getByRole("combobox", { name: "Role" })).toBeVisible(); expect(screen.getByRole("columnheader", { name: /Pengguna/ })).toHaveAttribute("aria-sort"); expect(screen.getByText("Kolom")).toBeVisible(); expect(screen.getByRole("link", { name: "Buka" })).toHaveAttribute("href", "/admin/users/usr-dewi?access=manage"); });
  it("persists sorting and role filtering in URL", async () => { const actor = userEvent.setup(); render(<AdminListPage kind="users" />); await actor.selectOptions(screen.getByRole("combobox", { name: "Role" }), role.id); expect(replace).toHaveBeenCalledWith(expect.stringContaining("role=role-admin"), { scroll: false }); await actor.click(screen.getByRole("button", { name: /Pengguna/ })); expect(replace).toHaveBeenCalledWith(expect.stringContaining("sort=name"), { scroll: false }); });
  it("denies persona none without exposing rows", () => { persona = "none"; render(<AdminListPage kind="users" />); expect(screen.getByText("Akses administrasi ditolak")).toBeVisible(); expect(screen.queryByText(user.email)).not.toBeInTheDocument(); });
});

describe("AdminFormPage production integration", () => {
  it("protects direct mutation routes for view persona", () => { persona = "view"; render(<AdminFormPage kind="roles" mode="create" />); expect(screen.getByText("Tidak dapat mengelola akses")).toBeVisible(); expect(screen.queryByRole("form")).not.toBeInTheDocument(); });
  it("uses accessible grouped matrix and blocks typed SoD reactively", async () => { const actor = userEvent.setup(); render(<AdminFormPage kind="roles" mode="create" />); expect(screen.getByRole("group", { name: "Access" })).toBeVisible(); await actor.click(screen.getByRole("checkbox", { name: /Kelola user dan role/ })); await actor.click(screen.getByRole("checkbox", { name: /Final approval PIC/ })); expect(screen.getByText(/SOD-ADMIN-FINAL-APPROVAL/)).toBeVisible(); expect(screen.getByText(/Blocking: ya/)).toBeVisible(); });
  it("shows reactive effective-permission preview for a role assignment", async () => { const actor = userEvent.setup(); render(<AdminFormPage kind="users" mode="create" />); await actor.click(screen.getByRole("checkbox", { name: role.name })); expect(screen.getByText(/Effective: access.manage/)).toBeVisible(); expect(screen.getByText(/Assigned role: Access Administrator/)).toBeVisible(); });
});

describe("AdminDetailPage production integration", () => {
  it("renders lifecycle impact and isolated audit actor fallback", async () => { const actor = userEvent.setup(); render(<AdminDetailPage kind="users" id={user.id} />); expect(screen.getByText(/usr-missing/)).toBeVisible(); expect(screen.getByText(/corr-audit/)).toBeVisible(); await actor.click(screen.getByRole("button", { name: "Nonaktifkan" })); expect(screen.getByRole("dialog", { name: /Nonaktifkan pengguna/ })).toBeVisible(); expect(screen.getByText(/Status saat ini: Active/)).toBeVisible(); expect(screen.getByRole("button", { name: "Konfirmasi" })).toBeDisabled(); });
});
