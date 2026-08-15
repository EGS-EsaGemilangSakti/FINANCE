import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/features/foundation/domain/errors";
import { AdminFormPage } from "./admin-form-page";

const state = vi.hoisted(() => ({ push: vi.fn(), toast: vi.fn(), saveUser: vi.fn(), saveRole: vi.fn(), userVersion: 2, roleVersion: 3 }));
const role = { id: "role-view", code: "VIEW", name: "Viewer", description: "Read only", status: "Active" as const, permissionKeys: ["access.view"] as const, isSystem: false, createdAt: "2026-08-10T00:00:00+07:00", updatedAt: "2026-08-10T00:00:00+07:00", version: 3 };
const user = { id: "usr-1", employeeId: "EMP-001", name: "Dewi Sari", email: "dewi@example.test", status: "Active" as const, roleIds: [role.id], projectScopeIds: ["prj-019"], createdAt: role.createdAt, updatedAt: role.updatedAt, version: 2 };
const query = <T,>(data: T) => ({ data, isPending: false, isError: false, error: null, refetch: vi.fn() });

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: state.push }), usePathname: () => "/admin/users/new", useSearchParams: () => new URLSearchParams("access=manage") }));
vi.mock("../permissions/demo-access", () => ({ useAccessPersona: () => ({ access: "manage", canView: true, canManage: true, actor: { userId: "usr-actor", permissionKeys: ["access.manage"] }, url: (path: string) => `${path}?access=manage` }) }));
vi.mock("sonner", () => ({ toast: { success: state.toast } }));
vi.mock("../queries/hooks", () => ({
  useAccessUser: () => query({ user: { ...user, version: state.userVersion }, roles: [role], effectivePermissions: ["access.view"], sodFindings: [], audit: [] }),
  useAccessRole: () => query({ role: { ...role, version: state.roleVersion }, userCount: 4, sodFindings: [], audit: [] }),
  useAccessRoles: () => query({ items: [role], total: 1, page: 1, pageSize: 50, hasNextPage: false }),
  usePermissionCatalog: () => query([
    { key: "access.view", module: "Access", label: "Lihat akses", description: "Read", risk: "Sensitive" },
    { key: "project.view", module: "Project", label: "Lihat project", description: "Read project", risk: "Standard" },
  ]),
  useSaveUser: () => ({ mutateAsync: state.saveUser, isPending: false, cancel: vi.fn() }),
  useSaveRole: () => ({ mutateAsync: state.saveRole, isPending: false, cancel: vi.fn() }),
}));

beforeEach(() => { state.push.mockReset(); state.toast.mockReset(); state.saveUser.mockReset(); state.saveRole.mockReset(); state.userVersion = 2; state.roleVersion = 3; });

async function validUser(actor: ReturnType<typeof userEvent.setup>) {
  await actor.type(screen.getByLabelText("Employee identifier"), "EMP-NEW");
  await actor.type(screen.getByLabelText("Nama"), "User Baru");
  await actor.type(screen.getByLabelText("Email"), "baru@example.test");
  await actor.click(screen.getByRole("checkbox", { name: "Viewer" }));
  await actor.type(screen.getByLabelText("Alasan perubahan"), "buat user");
}

describe("AdminFormPage User acceptance", () => {
  it("initializes create from the role read model and blocks an invalid submit", async () => {
    const actor = userEvent.setup(); render(<AdminFormPage kind="users" mode="create" />);
    expect(screen.getByLabelText("Employee identifier")).toHaveValue(""); expect(screen.getByLabelText("Employee identifier")).not.toHaveAttribute("readonly");
    expect(screen.getByLabelText("Nama")).toHaveValue(""); expect(screen.getByLabelText("Email")).toHaveValue(""); expect(screen.getByRole("checkbox", { name: "Viewer" })).not.toBeChecked();
    expect(screen.getByRole("textbox", { name: /^Project scope IDs/ })).toHaveValue(""); expect(screen.getByLabelText("Alasan perubahan")).toHaveValue(""); expect(screen.getByText(/Effective: Tidak ada/)).toBeVisible();
    await actor.click(screen.getByRole("button", { name: "Tinjau perubahan" }));
    const summary = (await screen.findByText("Periksa kembali form")).closest<HTMLElement>("[role='alert']"); expect(summary).not.toBeNull(); await waitFor(() => expect(summary).toHaveFocus()); expect(state.saveUser).not.toHaveBeenCalled();
    expect(screen.getByText("Identifier wajib diisi.")).toBeVisible(); expect(screen.getByText("Pilih minimal satu role.")).toBeVisible();
  });

  it("hydrates edit once, preserves edits across same-version rerender, and hydrates a new version", async () => {
    const actor = userEvent.setup(); const view = render(<AdminFormPage kind="users" mode="edit" id="usr-1" />);
    await waitFor(() => expect(screen.getByLabelText("Nama")).toHaveValue("Dewi Sari"));
    expect(screen.getByLabelText("Employee identifier")).toHaveAttribute("readonly"); expect(screen.getByRole("textbox", { name: /^Project scope IDs/ })).toHaveValue("prj-019"); expect(screen.getByRole("checkbox", { name: "Viewer" })).toBeChecked();
    await actor.clear(screen.getByLabelText("Nama")); await actor.type(screen.getByLabelText("Nama"), "Nama Lokal"); view.rerender(<AdminFormPage kind="users" mode="edit" id="usr-1" />); expect(screen.getByLabelText("Nama")).toHaveValue("Nama Lokal");
    state.userVersion = 4; view.rerender(<AdminFormPage kind="users" mode="edit" id="usr-1" />); await waitFor(() => expect(screen.getByLabelText("Nama")).toHaveValue("Dewi Sari"));
  });

  it("reactively compares role, effective permission, and project scope", async () => {
    const actor = userEvent.setup(); render(<AdminFormPage kind="users" mode="edit" id="usr-1" />); await waitFor(() => expect(screen.getByRole("checkbox", { name: "Viewer" })).toBeChecked());
    await actor.click(screen.getByRole("checkbox", { name: "Viewer" })); expect(screen.getByText(/Effective: Tidak ada/)).toBeVisible(); expect(screen.getByText(/Dihapus: access.view/)).toBeVisible();
    await actor.clear(screen.getByRole("textbox", { name: /^Project scope IDs/ })); await actor.type(screen.getByRole("textbox", { name: /^Project scope IDs/ }), "prj-026"); await actor.type(screen.getByLabelText("Alasan perubahan"), "ubah scope"); await actor.click(screen.getByRole("checkbox", { name: "Viewer" })); await actor.click(screen.getByRole("button", { name: "Tinjau perubahan" }));
    expect(screen.getByRole("dialog", { name: "Tinjau perubahan pengguna" })).toBeVisible(); expect(screen.getByText(/Scope ditambahkan: prj-026/)).toBeVisible(); expect(screen.getByText(/Scope dihapus: prj-019/)).toBeVisible(); expect(screen.getByText(/Alasan: ubah scope/)).toBeVisible();
    screen.getByRole("button", { name: "Tutup panel" }).focus(); await actor.keyboard("{Enter}"); expect(screen.queryByRole("dialog", { name: "Tinjau perubahan pengguna" })).not.toBeInTheDocument(); expect(screen.getByRole("textbox", { name: /^Project scope IDs/ })).toHaveValue("prj-026");
  });

  it("sends separated create metadata once and navigates with persona", async () => {
    state.saveUser.mockResolvedValue({ objectId: "usr-new", version: 1, message: "Tersimpan", correlationId: "corr-ok" }); const actor = userEvent.setup(); render(<AdminFormPage kind="users" mode="create" />); await validUser(actor); await actor.click(screen.getByRole("button", { name: "Tinjau perubahan" })); await actor.click(screen.getByRole("button", { name: "Simpan" }));
    await waitFor(() => expect(state.saveUser).toHaveBeenCalledOnce()); expect(state.saveUser.mock.calls[0][0]).toMatchObject({ data: { employeeId: "EMP-NEW", name: "User Baru", email: "baru@example.test", roleIds: ["role-view"] }, reason: "buat user", actor: { userId: "usr-actor" } }); expect(state.saveUser.mock.calls[0][0]).not.toHaveProperty("currentVersion"); expect(state.push).toHaveBeenCalledWith("/admin/users/usr-new?access=manage");
  });

  it("maps all typed backend fields to visible ARIA errors", async () => {
    state.saveUser.mockRejectedValue(new AppError(422, "USER_INVALID", "Periksa data pengguna.", { employeeId: ["ID backend"], name: ["Nama backend"], email: ["Email backend"], roleIds: ["Role backend"], projectScopeIds: ["Scope backend"], reason: ["Reason backend"] }, false, "corr-422"));
    const actor = userEvent.setup(); render(<AdminFormPage kind="users" mode="create" />); await validUser(actor); await actor.click(screen.getByRole("button", { name: "Tinjau perubahan" })); await actor.click(screen.getByRole("button", { name: "Simpan" }));
    expect(await screen.findByText("ID backend")).toBeVisible(); for (const message of ["Nama backend", "Email backend", "Role backend", "Scope backend", "Reason backend"]) expect(screen.getByText(message)).toBeVisible();
    const summary = screen.getByText("Periksa kembali form").closest<HTMLElement>("[role='alert']"); expect(summary).not.toBeNull(); await waitFor(() => expect(summary).toHaveFocus());
    for (const label of [/^Employee identifier/, /^Nama/, /^Email/, /^Alasan perubahan/]) { const control = screen.getByRole("textbox", { name: label }); expect(control).toHaveAttribute("aria-invalid", "true"); expect(control.getAttribute("aria-describedby")).toBeTruthy(); } const scopeControl = screen.getByRole("textbox", { name: /^Project scope IDs/ }); expect(scopeControl).toHaveAttribute("aria-invalid", "true"); expect(scopeControl.getAttribute("aria-describedby")).toBeTruthy();
    const roleControl = screen.getByRole("checkbox", { name: "Viewer" }); expect(roleControl).toHaveAttribute("aria-invalid", "true"); expect(roleControl.getAttribute("aria-describedby")).toBe("roleIds-message");
  });

  it("keeps review data on cancellation without error, navigation, or duplicate mutation", async () => {
    state.saveUser.mockRejectedValue(new DOMException("cancelled", "AbortError")); const actor = userEvent.setup(); render(<AdminFormPage kind="users" mode="create" />); await validUser(actor); await actor.click(screen.getByRole("button", { name: "Tinjau perubahan" })); await actor.click(screen.getByRole("button", { name: "Simpan" }));
    await waitFor(() => expect(state.saveUser).toHaveBeenCalledOnce()); expect(screen.getByRole("dialog", { name: "Tinjau perubahan pengguna" })).toBeVisible(); expect(screen.queryByText(/correlation/i)).not.toBeInTheDocument(); expect(state.push).not.toHaveBeenCalled();
  });

  it("retries a User 503 with identical review data and sanitizes unexpected failures", async () => {
    const actor = userEvent.setup(); state.saveUser.mockRejectedValueOnce(new AppError(503, "SERVICE_UNAVAILABLE", "Layanan sementara tidak tersedia.", {}, true, "corr-503")).mockResolvedValueOnce({ objectId: "usr-retry", version: 1, message: "Tersimpan", correlationId: "corr-ok" }); const view = render(<AdminFormPage kind="users" mode="create" />); await validUser(actor); await actor.click(screen.getByRole("button", { name: "Tinjau perubahan" })); await actor.click(screen.getByRole("button", { name: "Simpan" })); expect(await screen.findByText(/SERVICE_UNAVAILABLE/)).toBeVisible(); expect(screen.getByText(/corr-503/)).toBeVisible(); await actor.click(screen.getByRole("button", { name: "Coba lagi" })); await waitFor(() => expect(state.saveUser).toHaveBeenCalledTimes(2)); expect(state.saveUser.mock.calls[1]?.[0]).toEqual(state.saveUser.mock.calls[0]?.[0]);
    view.unmount(); state.saveUser.mockReset().mockRejectedValue(new Error("database password secret")); render(<AdminFormPage kind="users" mode="create" />); await validUser(actor); await actor.click(screen.getByRole("button", { name: "Tinjau perubahan" })); await actor.click(screen.getByRole("button", { name: "Simpan" })); expect(await screen.findByText(/UNEXPECTED_ERROR/)).toBeVisible(); expect(screen.queryByText(/database password secret/)).not.toBeInTheDocument();
  });

  it("renders a non-retryable User 403 safely without retry, success, navigation, or repeat", async () => {
    state.saveUser.mockRejectedValue(new AppError(403, "ACCESS_FORBIDDEN", "Anda tidak memiliki izin mengubah pengguna.", {}, false, "corr-user-403")); const actor = userEvent.setup(); render(<AdminFormPage kind="users" mode="create" />); await validUser(actor); await actor.click(screen.getByRole("button", { name: "Tinjau perubahan" })); await actor.click(screen.getByRole("button", { name: "Simpan" }));
    expect(await screen.findByText(/ACCESS_FORBIDDEN: Anda tidak memiliki izin/)).toBeVisible(); expect(screen.getByText(/corr-user-403/)).toBeVisible(); expect(screen.queryByRole("button", { name: "Coba lagi" })).not.toBeInTheDocument(); expect(screen.queryByText("Data telah berubah")).not.toBeInTheDocument(); expect(state.toast).not.toHaveBeenCalled(); expect(state.push).not.toHaveBeenCalled(); expect(state.saveUser).toHaveBeenCalledOnce(); expect(screen.getByLabelText("Nama")).toHaveValue("User Baru");
  });

  it("guards dirty navigation and cleans beforeunload on unmount", async () => {
    const add = vi.spyOn(window, "addEventListener"), remove = vi.spyOn(window, "removeEventListener"), actor = userEvent.setup(); const view = render(<AdminFormPage kind="users" mode="create" />);
    await actor.click(screen.getByRole("button", { name: "Kembali" })); expect(state.push).toHaveBeenCalledOnce(); state.push.mockReset(); await actor.type(screen.getByLabelText("Nama"), "dirty"); await actor.click(screen.getByRole("button", { name: "Kembali" })); expect(screen.getByRole("dialog", { name: "Perubahan belum disimpan" })).toBeVisible(); await actor.click(screen.getByRole("button", { name: "Tetap di halaman" })); expect(state.push).not.toHaveBeenCalled();
    await actor.click(screen.getByRole("button", { name: "Kembali" })); await actor.click(screen.getByRole("button", { name: "Keluar tanpa menyimpan" })); expect(state.push).toHaveBeenCalledOnce(); expect(add).toHaveBeenCalledWith("beforeunload", expect.any(Function)); view.unmount(); expect(remove).toHaveBeenCalledWith("beforeunload", expect.any(Function)); add.mockRestore(); remove.mockRestore();
  });
});

describe("AdminFormPage Role acceptance", () => {
  it("initializes an accessible grouped create matrix and validates fields", async () => {
    const actor = userEvent.setup(); render(<AdminFormPage kind="roles" mode="create" />); expect(screen.getByLabelText("Kode role")).toHaveValue(""); expect(screen.getByLabelText("Nama role")).toHaveValue(""); expect(screen.getByRole("group", { name: "Access" })).toBeVisible(); expect(screen.getByRole("checkbox", { name: /Lihat administrasi akses/ })).not.toBeChecked(); expect(screen.getAllByText(/access.view/).length).toBeGreaterThan(0); expect(screen.getAllByText(/Risiko Sensitive/).length).toBeGreaterThan(0);
    await actor.type(screen.getByLabelText("Kode role"), "bad code"); await actor.click(screen.getByRole("button", { name: "Tinjau perubahan" })); expect(await screen.findByText(/Kode memakai/)).toBeVisible(); expect(state.saveRole).not.toHaveBeenCalled();
  });

  it("hydrates edit once and produces a keyboard-operated comparison", async () => {
    const actor = userEvent.setup(); const view = render(<AdminFormPage kind="roles" mode="edit" id="role-view" />); await waitFor(() => expect(screen.getByLabelText("Nama role")).toHaveValue("Viewer")); expect(screen.getByLabelText("Kode role")).toHaveAttribute("readonly"); expect(screen.getByText(/1 permission dipilih/)).toBeVisible();
    await actor.clear(screen.getByLabelText("Nama role")); await actor.type(screen.getByLabelText("Nama role"), "Nama Lokal"); view.rerender(<AdminFormPage kind="roles" mode="edit" id="role-view" />); expect(screen.getByLabelText("Nama role")).toHaveValue("Nama Lokal");
    const project = screen.getByRole("checkbox", { name: /Lihat project/ }); project.focus(); await actor.keyboard(" "); await actor.type(screen.getByLabelText("Alasan perubahan"), "ubah izin"); screen.getByRole("button", { name: "Tinjau perubahan" }).focus(); await actor.keyboard("{Enter}"); expect(screen.getByRole("dialog", { name: "Bandingkan permission" })).toBeVisible(); expect(screen.getByText(/Ditambahkan: project.view/)).toBeVisible(); expect(screen.getByText(/Tetap: 1/)).toBeVisible(); expect(screen.getByText(/Pengguna terdampak: 4/)).toBeVisible();
  });

  it("sends actual edit version and separated metadata", async () => {
    state.saveRole.mockResolvedValue({ objectId: "role-view", version: 4, message: "Role tersimpan", correlationId: "corr-role" }); const actor = userEvent.setup(); render(<AdminFormPage kind="roles" mode="edit" id="role-view" />); await waitFor(() => expect(screen.getByLabelText("Nama role")).toHaveValue("Viewer")); await actor.type(screen.getByLabelText("Alasan perubahan"), "simpan role"); await actor.click(screen.getByRole("button", { name: "Tinjau perubahan" })); await actor.click(screen.getByRole("button", { name: "Simpan" })); await waitFor(() => expect(state.saveRole).toHaveBeenCalledOnce()); expect(state.saveRole.mock.calls[0][0]).toMatchObject({ roleId: "role-view", currentVersion: 3, reason: "simpan role", actor: { userId: "usr-actor" }, data: { code: "VIEW", name: "Viewer", permissionKeys: ["access.view"] } }); expect(state.saveRole.mock.calls[0][0].data).not.toHaveProperty("reason"); expect(state.push).toHaveBeenCalledWith("/admin/roles/role-view?access=manage");
  });

  it("creates a Role once with separated metadata, review context, toast, and persona navigation", async () => {
    state.saveRole.mockResolvedValue({ objectId: "role-new", version: 1, message: "Role dibuat", correlationId: "corr-created" }); const actor = userEvent.setup(); render(<AdminFormPage kind="roles" mode="create" />); expect(screen.getByLabelText("Kode role")).not.toHaveAttribute("readonly"); await actor.type(screen.getByLabelText("Kode role"), "OPS_VIEW"); await actor.type(screen.getByLabelText("Nama role"), "Operations Viewer"); await actor.type(screen.getByLabelText("Deskripsi"), "Read operations"); await actor.click(screen.getByRole("checkbox", { name: /Lihat administrasi akses/ })); await actor.type(screen.getByLabelText("Alasan perubahan"), "buat role"); await actor.click(screen.getByRole("button", { name: "Tinjau perubahan" }));
    expect(screen.getByText(/Ditambahkan: access.view/)).toBeVisible(); expect(screen.getByText(/Pengguna terdampak: 0/)).toBeVisible(); expect(screen.getByText(/Alasan: buat role/)).toBeVisible(); expect(screen.getByText(/Access: access.view.*Risiko Sensitive/)).toBeVisible(); await actor.click(screen.getByRole("button", { name: "Simpan" })); await waitFor(() => expect(state.saveRole).toHaveBeenCalledOnce()); const sent = state.saveRole.mock.calls[0]?.[0]; expect(sent).not.toHaveProperty("currentVersion"); expect(sent).toMatchObject({ data: { code: "OPS_VIEW", name: "Operations Viewer", description: "Read operations", permissionKeys: ["access.view"] }, reason: "buat role", actor: { userId: "usr-actor" } }); expect(Object.keys(sent.data)).toEqual(["code", "name", "description", "permissionKeys"]); expect(state.toast).toHaveBeenCalledWith("Role dibuat"); expect(state.push).toHaveBeenCalledWith("/admin/roles/role-new?access=manage");
  });

  it("retries a Role 503 once with identical payload and navigates only after success", async () => {
    state.saveRole.mockRejectedValueOnce(new AppError(503, "SERVICE_UNAVAILABLE", "Role sementara tidak dapat disimpan.", {}, true, "corr-role-503")).mockResolvedValueOnce({ objectId: "role-view", version: 4, message: "Role tersimpan", correlationId: "corr-ok" }); const actor = userEvent.setup(); render(<AdminFormPage kind="roles" mode="edit" id="role-view" />); await waitFor(() => expect(screen.getByLabelText("Nama role")).toHaveValue("Viewer")); await actor.type(screen.getByLabelText("Alasan perubahan"), "retry role"); await actor.click(screen.getByRole("button", { name: "Tinjau perubahan" })); await actor.click(screen.getByRole("button", { name: "Simpan" })); expect(await screen.findByText(/SERVICE_UNAVAILABLE: Role sementara/)).toBeVisible(); expect(screen.getByText(/corr-role-503/)).toBeVisible(); expect(state.push).not.toHaveBeenCalled(); expect(screen.getByRole("checkbox", { name: /Lihat administrasi akses/ })).toBeChecked(); await actor.click(screen.getByRole("button", { name: "Coba lagi" })); await waitFor(() => expect(state.saveRole).toHaveBeenCalledTimes(2)); expect(state.saveRole.mock.calls[1]?.[0]).toEqual(state.saveRole.mock.calls[0]?.[0]); expect(state.push).toHaveBeenCalledOnce();
  });

  it("renders Role 403 without retry or repeat and preserves form values", async () => {
    state.saveRole.mockRejectedValue(new AppError(403, "ACCESS_FORBIDDEN", "Tidak diizinkan mengubah role.", {}, false, "corr-role-403")); const actor = userEvent.setup(); render(<AdminFormPage kind="roles" mode="edit" id="role-view" />); await waitFor(() => expect(screen.getByLabelText("Nama role")).toHaveValue("Viewer")); await actor.type(screen.getByLabelText("Alasan perubahan"), "forbidden role"); await actor.click(screen.getByRole("button", { name: "Tinjau perubahan" })); await actor.click(screen.getByRole("button", { name: "Simpan" })); expect(await screen.findByText(/ACCESS_FORBIDDEN: Tidak diizinkan/)).toBeVisible(); expect(screen.getByText(/corr-role-403/)).toBeVisible(); expect(screen.queryByRole("button", { name: "Coba lagi" })).not.toBeInTheDocument(); expect(state.saveRole).toHaveBeenCalledOnce(); expect(state.push).not.toHaveBeenCalled(); expect(state.toast).not.toHaveBeenCalled(); expect(screen.getByLabelText("Nama role")).toHaveValue("Viewer");
  });

  it("guards dirty Role changes, preserves them on stay, navigates on leave, and cleans beforeunload", async () => {
    const add = vi.spyOn(window, "addEventListener"), remove = vi.spyOn(window, "removeEventListener"), actor = userEvent.setup(), view = render(<AdminFormPage kind="roles" mode="create" />); await actor.click(screen.getByRole("button", { name: "Kembali" })); expect(state.push).toHaveBeenCalledOnce(); state.push.mockReset(); await actor.type(screen.getByLabelText("Kode role"), "DIRTY"); await actor.type(screen.getByLabelText("Nama role"), "Dirty Role"); await actor.click(screen.getByRole("checkbox", { name: /Lihat administrasi akses/ })); await actor.click(screen.getByRole("button", { name: "Kembali" })); expect(screen.getByRole("dialog", { name: "Perubahan belum disimpan" })).toBeVisible(); await actor.click(screen.getByRole("button", { name: "Tetap di halaman" })); expect(screen.getByLabelText("Kode role")).toHaveValue("DIRTY"); await actor.click(screen.getByRole("button", { name: "Kembali" })); await actor.click(screen.getByRole("button", { name: "Keluar tanpa menyimpan" })); expect(state.push).toHaveBeenCalledOnce(); expect(add).toHaveBeenCalledWith("beforeunload", expect.any(Function)); view.unmount(); expect(remove).toHaveBeenCalledWith("beforeunload", expect.any(Function)); add.mockRestore(); remove.mockRestore();
  });

  it("maps Role backend fields and permission group to ARIA relationships", async () => {
    state.saveRole.mockRejectedValue(new AppError(422, "ROLE_INVALID", "Periksa role.", { code: ["Kode backend"], name: ["Nama backend"], description: ["Deskripsi backend"], permissionKeys: ["Permission backend"], reason: ["Reason backend"] }, false, "corr-role-422"));
    const actor = userEvent.setup(); render(<AdminFormPage kind="roles" mode="edit" id="role-view" />); await waitFor(() => expect(screen.getByLabelText("Nama role")).toHaveValue("Viewer")); await actor.type(screen.getByLabelText("Alasan perubahan"), "uji backend"); await actor.click(screen.getByRole("button", { name: "Tinjau perubahan" })); await actor.click(screen.getByRole("button", { name: "Simpan" }));
    for (const message of ["Kode backend", "Nama backend", "Deskripsi backend", "Permission backend", "Reason backend"]) expect(await screen.findByText(message)).toBeVisible();
    for (const name of [/^Kode role/, /^Nama role/, /^Deskripsi/, /^Alasan perubahan/]) { const control = screen.getByRole("textbox", { name }); expect(control).toHaveAttribute("aria-invalid", "true"); expect(control.getAttribute("aria-describedby")).toBeTruthy(); }
    const permission = screen.getByRole("checkbox", { name: /Lihat administrasi akses/ }); expect(permission).toHaveAttribute("aria-invalid", "true"); expect(permission.getAttribute("aria-describedby")).toBe("permissionKeys-message");
  });

  it("preserves Role review data on cancellation without false feedback", async () => {
    state.saveRole.mockRejectedValue(new DOMException("cancel", "AbortError")); const actor = userEvent.setup(); render(<AdminFormPage kind="roles" mode="edit" id="role-view" />); await waitFor(() => expect(screen.getByLabelText("Nama role")).toHaveValue("Viewer")); await actor.type(screen.getByLabelText("Alasan perubahan"), "cancel role"); await actor.click(screen.getByRole("button", { name: "Tinjau perubahan" })); await actor.click(screen.getByRole("button", { name: "Simpan" })); await waitFor(() => expect(state.saveRole).toHaveBeenCalledOnce()); expect(screen.getByRole("dialog", { name: "Bandingkan permission" })).toBeVisible(); expect(screen.queryByText(/ID korelasi/)).not.toBeInTheDocument(); expect(state.push).not.toHaveBeenCalled();
  });
});
