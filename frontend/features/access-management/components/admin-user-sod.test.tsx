import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { AdminFormPage } from "./admin-form-page";

const mutate = vi.hoisted(() => vi.fn());
const base = { status: "Active" as const, isSystem: false, createdAt: "2026-08-10T00:00:00+07:00", updatedAt: "2026-08-10T00:00:00+07:00", version: 1 };
const roles = [{ ...base, id: "role-access", code: "ACCESS", name: "Access Manager", description: "Access", permissionKeys: ["access.manage"] }, { ...base, id: "role-pic", code: "PIC", name: "PIC Approver", description: "Approval", permissionKeys: ["pic.approve"] }];
const q = <T,>(data: T) => ({ data, isPending: false, isError: false, error: null, refetch: vi.fn() });
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }), usePathname: () => "/admin/users/new", useSearchParams: () => new URLSearchParams("access=manage") }));
vi.mock("../permissions/demo-access", () => ({ useAccessPersona: () => ({ access: "manage", canView: true, canManage: true, actor: { userId: "actor", permissionKeys: ["access.manage"] }, url: (path: string) => `${path}?access=manage` }) }));
vi.mock("../queries/hooks", () => ({ useAccessUser: () => q(undefined), useAccessRoles: () => q({ items: roles, total: 2, page: 1, pageSize: 50, hasNextPage: false }), useSaveUser: () => ({ mutateAsync: mutate, isPending: false, cancel: vi.fn() }) }));

it("blocks User review only for the cross-role access.manage and pic.approve SoD combination", async () => {
  const actor = userEvent.setup(); render(<AdminFormPage kind="users" mode="create" />); const access = screen.getByRole("checkbox", { name: "Access Manager" }), pic = screen.getByRole("checkbox", { name: "PIC Approver" });
  await actor.click(access); expect(screen.queryByText(/SOD-ADMIN-FINAL-APPROVAL/)).not.toBeInTheDocument(); await actor.click(access); await actor.click(pic); expect(screen.queryByText(/SOD-ADMIN-FINAL-APPROVAL/)).not.toBeInTheDocument(); await actor.click(access);
  expect(screen.getAllByText(/SOD-ADMIN-FINAL-APPROVAL/).length).toBeGreaterThan(0); expect(screen.getAllByText(/Critical/).length).toBeGreaterThan(0); expect(screen.getAllByText(/Pengelola user\/role tidak boleh/).length).toBeGreaterThan(0); expect(screen.getAllByText(/Hapus permission final approval PIC/).length).toBeGreaterThan(0); expect(screen.getByText(/Blocking: ya/)).toBeVisible(); expect(screen.getByText(/Effective: access.manage, pic.approve/)).toBeVisible();
  await actor.type(screen.getByLabelText("Employee identifier"), "EMP-SOD"); await actor.type(screen.getByLabelText("Nama"), "User SOD"); await actor.type(screen.getByLabelText("Email"), "sod@example.test"); await actor.type(screen.getByLabelText("Alasan perubahan"), "uji sod"); await actor.click(screen.getByRole("button", { name: "Tinjau perubahan" })); expect(screen.getByText(/Effective permission ditambahkan: access.manage, pic.approve/)).toBeVisible(); expect(screen.getByRole("button", { name: "Simpan" })).toBeDisabled(); expect(mutate).not.toHaveBeenCalled();
  await actor.click(access); expect(screen.queryByText(/SOD-ADMIN-FINAL-APPROVAL/)).not.toBeInTheDocument(); const review = screen.getByRole("dialog", { name: "Tinjau perubahan pengguna" }); await actor.click(within(review).getByRole("button", { name: "Kembali" })); await actor.click(screen.getByRole("button", { name: "Tinjau perubahan" })); expect(screen.getByRole("button", { name: "Simpan" })).toBeEnabled();
});
