import { describe, expect, it } from "vitest";
import { AppError } from "@/features/foundation/domain/errors";
import { normalizeAccessListQuery } from "../domain/logic";
import type { PermissionKey } from "../domain/types";
import { accessRepository } from "./mock-adapter";

const actor = { userId: "usr-dewi", permissionKeys: ["access.view", "access.manage"] } as const;

describe("access-management mock repository", () => {
  it("searches, filters, sorts and paginates seed data", async () => {
    const searched = await accessRepository.listUsers(normalizeAccessListQuery({ search: "raka", statuses: ["Active"], sort: "name", direction: "asc", page: 1, pageSize: 10 }));
    expect(searched.items.map(item => item.employeeId)).toEqual(["EMP-002"]);
    const paged = await accessRepository.listRoles(normalizeAccessListQuery({ sort: "name", direction: "asc", page: 1, pageSize: 10 }));
    expect(paged.total).toBe(3);
    expect(paged.items.map(item => item.name)).toEqual([...paged.items.map(item => item.name)].sort());
  });
  it("returns 404 and preserves cancellation", async () => {
    await expect(accessRepository.getUser("missing")).rejects.toMatchObject({ status: 404, code: "USER_NOT_FOUND" });
    const controller = new AbortController(); controller.abort();
    await expect(accessRepository.listPermissions(controller.signal)).rejects.toMatchObject({ name: "AbortError" });
  });
  it("rejects unauthorized writes", async () => {
    const command = { data: { code: "NOPE", name: "Nope", description: "Nope", permissionKeys: ["project.view"] as const }, reason: "uji izin", actor: { userId: "usr-raka", permissionKeys: ["access.view"] } };
    await expect(accessRepository.saveRole(command)).rejects.toMatchObject({ status: 403, code: "ACCESS_FORBIDDEN" });
  });
  it("enforces unique identifiers and structured field errors", async () => {
    const command = { data: { employeeId: "EMP-001", name: "Duplicate", email: "other@example.test", roleIds: ["role-finance"], projectScopeIds: [] }, reason: "uji duplikat", actor };
    await expect(accessRepository.saveUser(command)).rejects.toSatisfy((error: unknown) => error instanceof AppError && error.status === 422 && Boolean(error.field_errors.employeeId));
  });
  it("rejects a blocking SoD combination atomically", async () => {
    const command = { data: { code: "BAD_SOD", name: "Bad SoD", description: "Must fail", permissionKeys: ["access.manage", "pic.approve"] as const }, reason: "uji sod", actor };
    await expect(accessRepository.saveRole(command)).rejects.toMatchObject({ status: 422, code: "SOD_CONFLICT" });
    const list = await accessRepository.listRoles(normalizeAccessListQuery({ search: "BAD_SOD" }));
    expect(list.total).toBe(0);
  });
  it("creates an auditable role and detects stale updates", async () => {
    const created = await accessRepository.saveRole({ data: { code: "AUDITOR_TEST", name: "Auditor Test", description: "Role demo test", permissionKeys: ["access.view"] }, reason: "uji audit", actor });
    const detail = await accessRepository.getRole(created.objectId);
    expect(detail.audit[0]).toMatchObject({ action: "role.created", actorUserId: actor.userId, reason: "uji audit" });
    await expect(accessRepository.saveRole({ roleId: created.objectId, currentVersion: 99, data: { code: "AUDITOR_TEST", name: "Changed", description: "Changed", permissionKeys: ["access.view", "project.view"] }, reason: "uji konflik", actor })).rejects.toMatchObject({ status: 409, code: "ROLE_VERSION_CONFLICT", correlation_id: "demo-role-conflict", metadata: { userVersion: 99, latestVersion: 1, diffs: expect.arrayContaining([expect.objectContaining({ field: "name", before: "Changed" }), expect.objectContaining({ field: "permissionKeys" })]) } });
  });
  it("prevents deactivating a role assigned to an active user", async () => {
    await expect(accessRepository.setRoleStatus({ objectId: "role-admin", currentVersion: 2, target: "Inactive", reason: "uji dependency", actor })).rejects.toMatchObject({ status: 422, code: "ROLE_IN_USE" });
  });
  it("normalizes duplicate role and project scope assignments without leaking command metadata", async () => {
    const result = await accessRepository.saveUser({ data: { employeeId: "EMP-NORMALIZED", name: "Normalized User", email: "normalized@example.test", roleIds: ["role-finance", "role-finance"], projectScopeIds: ["prj-019", "prj-019"] }, reason: "uji normalisasi", actor });
    const detail = await accessRepository.getUser(result.objectId);
    expect(detail.user.roleIds).toEqual(["role-finance"]); expect(detail.user.projectScopeIds).toEqual(["prj-019"]); expect(detail.effectivePermissions).toEqual(["project.view"]);
    expect(detail.user).not.toHaveProperty("actor"); expect(detail.user).not.toHaveProperty("reason"); expect(detail.user).not.toHaveProperty("currentVersion");
  });
  it("rejects crafted cross-role SoD assignment and activation atomically", async () => {
    await expect(accessRepository.saveUser({ data: { employeeId: "EMP-SOD", name: "Crafted SoD", email: "crafted.sod@example.test", roleIds: ["role-admin", "role-pic"], projectScopeIds: [] }, reason: "uji crafted sod", actor })).rejects.toMatchObject({ status: 422, code: "SOD_CONFLICT" });
    await expect(accessRepository.setUserStatus({ objectId: "usr-sod-inactive", currentVersion: 1, target: "Active", reason: "uji aktivasi sod", actor })).rejects.toMatchObject({ status: 422, code: "SOD_CONFLICT" });
    expect((await accessRepository.getUser("usr-sod-inactive")).user.status).toBe("Inactive");
    expect(await accessRepository.listUserAudit("usr-sod-inactive")).toEqual([]);
  });
  it("aborts mutation before state and audit, then permits a fresh mutation", async () => {
    const controller = new AbortController();
    const aborted = accessRepository.saveRole({ data: { code: "ABORTED_ROLE", name: "Aborted", description: "Should not persist", permissionKeys: ["access.view"] }, reason: "uji abort", actor }, controller.signal); controller.abort();
    await expect(aborted).rejects.toMatchObject({ name: "AbortError" });
    expect((await accessRepository.listRoles(normalizeAccessListQuery({ search: "ABORTED_ROLE" }))).total).toBe(0);
    const next = await accessRepository.saveRole({ data: { code: "AFTER_ABORT", name: "After Abort", description: "Fresh controller", permissionKeys: ["access.view", "access.view"] }, reason: "uji setelah abort", actor });
    expect((await accessRepository.getRole(next.objectId)).role.permissionKeys).toEqual(["access.view"]);
    expect((await accessRepository.listRoleAudit(next.objectId))[0]).toMatchObject({ action: "role.created", actorName: "Dewi Sari" });
  });
  it("keeps immutable identifiers on update and writes a safe aggregate audit", async () => {
    const created = await accessRepository.saveUser({ data: { employeeId: "EMP-IMMUTABLE", name: "Before", email: "immutable@example.test", roleIds: ["role-finance"], projectScopeIds: [] }, reason: "buat immutable", actor });
    const updated = await accessRepository.saveUser({ userId: created.objectId, currentVersion: created.version, data: { employeeId: "EMP-CHANGED", name: "After", email: "after@example.test", roleIds: ["role-finance"], projectScopeIds: ["prj-026"] }, reason: "ubah user", actor });
    const detail = await accessRepository.getUser(updated.objectId); expect(detail.user.employeeId).toBe("EMP-IMMUTABLE"); expect(detail.user.name).toBe("After");
    expect((await accessRepository.listUserAudit(updated.objectId))[0]).toMatchObject({ action: "user.updated", reason: "ubah user" });
  });
  it("returns submitted/latest user field, role, and scope conflict diff without audit", async () => {
    const created = await accessRepository.saveUser({ data: { employeeId: "EMP-CONFLICT", name: "Latest", email: "latest@example.test", roleIds: ["role-finance"], projectScopeIds: ["prj-019"] }, reason: "buat konflik", actor });
    const auditBefore = await accessRepository.listUserAudit(created.objectId);
    await expect(accessRepository.saveUser({ userId: created.objectId, currentVersion: 99, data: { employeeId: "EMP-CONFLICT", name: "Submitted", email: "submitted@example.test", roleIds: ["role-admin"], projectScopeIds: ["prj-026"] }, reason: "stale update", actor })).rejects.toMatchObject({ status: 409, correlation_id: "demo-user-conflict", metadata: { userVersion: 99, latestVersion: 1, diffs: expect.arrayContaining([expect.objectContaining({ field: "name", before: "Submitted", after: "Latest" }), expect.objectContaining({ field: "roleIds" }), expect.objectContaining({ field: "projectScopeIds" })]) } });
    expect(await accessRepository.listUserAudit(created.objectId)).toHaveLength(auditBefore.length);
  });
  it("supports valid user and role lifecycle transitions with versioned audit", async () => {
    const createdUser = await accessRepository.saveUser({ data: { employeeId: "EMP-LIFECYCLE", name: "Lifecycle", email: "lifecycle@example.test", roleIds: ["role-finance"], projectScopeIds: [] }, reason: "buat lifecycle", actor });
    const inactiveUser = await accessRepository.setUserStatus({ objectId: createdUser.objectId, currentVersion: createdUser.version, target: "Inactive", reason: "nonaktifkan user", actor });
    const activeUser = await accessRepository.setUserStatus({ objectId: createdUser.objectId, currentVersion: inactiveUser.version, target: "Active", reason: "aktifkan user", actor });
    expect((await accessRepository.getUser(createdUser.objectId)).user).toMatchObject({ status: "Active", version: activeUser.version });
    expect((await accessRepository.listUserAudit(createdUser.objectId)).map(event => event.action)).toEqual(expect.arrayContaining(["user.activated", "user.deactivated"]));
    const createdRole = await accessRepository.saveRole({ data: { code: "LIFECYCLE_ROLE", name: "Lifecycle Role", description: "Lifecycle", permissionKeys: ["access.view"] }, reason: "buat lifecycle role", actor });
    const inactiveRole = await accessRepository.setRoleStatus({ objectId: createdRole.objectId, currentVersion: createdRole.version, target: "Inactive", reason: "nonaktifkan role", actor });
    const activeRole = await accessRepository.setRoleStatus({ objectId: createdRole.objectId, currentVersion: inactiveRole.version, target: "Active", reason: "aktifkan role", actor });
    expect((await accessRepository.getRole(createdRole.objectId)).role).toMatchObject({ status: "Active", version: activeRole.version });
  });
  it("rejects a duplicate email update with field error and no state or success audit", async () => { const first = await accessRepository.saveUser({ data: { employeeId: "EMP-EMAIL-A", name: "Email A", email: "unique-a@example.test", roleIds: ["role-finance"], projectScopeIds: [] }, reason: "buat A", actor }); const second = await accessRepository.saveUser({ data: { employeeId: "EMP-EMAIL-B", name: "Email B", email: "unique-b@example.test", roleIds: ["role-finance"], projectScopeIds: [] }, reason: "buat B", actor }); const before = await accessRepository.getUser(second.objectId), auditBefore = await accessRepository.listUserAudit(second.objectId); await expect(accessRepository.saveUser({ userId: second.objectId, currentVersion: second.version, data: { ...before.user, email: (await accessRepository.getUser(first.objectId)).user.email }, reason: "duplikat email", actor })).rejects.toSatisfy((error: unknown) => error instanceof AppError && error.status === 422 && Boolean(error.field_errors.email)); expect((await accessRepository.getUser(second.objectId)).user).toEqual(before.user); expect(await accessRepository.listUserAudit(second.objectId)).toHaveLength(auditBefore.length); });
  it("rejects unknown and inactive role assignments atomically with roleIds errors", async () => { const target = await accessRepository.saveUser({ data: { employeeId: "EMP-ROLE-VALIDATE", name: "Role Validate", email: "role.validate@example.test", roleIds: ["role-finance"], projectScopeIds: [] }, reason: "buat target", actor }); const inactive = await accessRepository.saveRole({ data: { code: "INACTIVE_ASSIGN", name: "Inactive Assign", description: "Inactive", permissionKeys: ["project.manage"] }, reason: "buat inactive", actor }); await accessRepository.setRoleStatus({ objectId: inactive.objectId, currentVersion: inactive.version, target: "Inactive", reason: "nonaktifkan", actor }); for (const roleId of ["role-missing", inactive.objectId]) { const before = await accessRepository.getUser(target.objectId), audits = await accessRepository.listUserAudit(target.objectId); await expect(accessRepository.saveUser({ userId: target.objectId, currentVersion: before.user.version, data: { ...before.user, roleIds: [roleId] }, reason: "invalid role", actor })).rejects.toSatisfy((error: unknown) => error instanceof AppError && error.status === 422 && Boolean(error.field_errors.roleIds)); expect((await accessRepository.getUser(target.objectId)).user).toEqual(before.user); expect((await accessRepository.getUser(target.objectId)).effectivePermissions).toEqual(before.effectivePermissions); expect(await accessRepository.listUserAudit(target.objectId)).toHaveLength(audits.length); } });
  it("rejects crafted unknown permission without changing role or audit", async () => { const created = await accessRepository.saveRole({ data: { code: "UNKNOWN_PERMISSION", name: "Permission Boundary", description: "Boundary", permissionKeys: ["access.view"] }, reason: "buat role", actor }); const before = await accessRepository.getRole(created.objectId), audits = await accessRepository.listRoleAudit(created.objectId), crafted = "crafted.permission" as PermissionKey; await expect(accessRepository.saveRole({ roleId: created.objectId, currentVersion: created.version, data: { ...before.role, permissionKeys: [crafted] }, reason: "crafted", actor })).rejects.toMatchObject({ status: 422, code: "PERMISSION_UNKNOWN", field_errors: { permissionKeys: expect.any(Array) } }); expect((await accessRepository.getRole(created.objectId)).role).toEqual(before.role); expect(await accessRepository.listRoleAudit(created.objectId)).toHaveLength(audits.length); });
  it("rejects same-state lifecycle and view-only actors without version or audit changes", async () => { const createdUser = await accessRepository.saveUser({ data: { employeeId: "EMP-STATE-GUARD", name: "State Guard", email: "state.guard@example.test", roleIds: ["role-finance"], projectScopeIds: [] }, reason: "buat user", actor }); const createdRole = await accessRepository.saveRole({ data: { code: "STATE_GUARD", name: "State Guard", description: "State", permissionKeys: ["project.view"] }, reason: "buat role", actor }); const readonlyActor = { userId: "usr-readonly", permissionKeys: ["access.view"] } as const; for (const [kind, id, version] of [["user", createdUser.objectId, createdUser.version], ["role", createdRole.objectId, createdRole.version]] as const) { const auditBefore = kind === "user" ? await accessRepository.listUserAudit(id) : await accessRepository.listRoleAudit(id), detailBefore = kind === "user" ? (await accessRepository.getUser(id)).user : (await accessRepository.getRole(id)).role, operation = kind === "user" ? accessRepository.setUserStatus.bind(accessRepository) : accessRepository.setRoleStatus.bind(accessRepository); await expect(operation({ objectId: id, currentVersion: version, target: "Active", reason: "same state", actor })).rejects.toMatchObject({ status: 422, code: kind === "user" ? "USER_STATE_INVALID" : "ROLE_STATE_INVALID" }); await expect(operation({ objectId: id, currentVersion: version, target: "Inactive", reason: "forbidden", actor: readonlyActor })).rejects.toMatchObject({ status: 403, code: "ACCESS_FORBIDDEN" }); const detailAfter = kind === "user" ? (await accessRepository.getUser(id)).user : (await accessRepository.getRole(id)).role; expect(detailAfter).toEqual(detailBefore); expect(kind === "user" ? await accessRepository.listUserAudit(id) : await accessRepository.listRoleAudit(id)).toHaveLength(auditBefore.length); } });
  it("isolates Role update metadata, immutable code, normalized permissions, and authoritative audit", async () => { const created = await accessRepository.saveRole({ data: { code: "ROLE_METADATA", name: "Role Metadata", description: "Before", permissionKeys: ["access.view"] }, reason: "buat role", actor }); await accessRepository.saveRole({ roleId: created.objectId, currentVersion: created.version, data: { code: "ATTEMPT_CHANGE", name: "Role Metadata Updated", description: "After", permissionKeys: ["project.view", "project.view"] }, reason: "ubah metadata", actor }); const detail = await accessRepository.getRole(created.objectId); expect(detail.role.code).toBe("ROLE_METADATA"); expect(detail.role.permissionKeys).toEqual(["project.view"]); for (const key of ["actor", "reason", "currentVersion", "data"]) expect(detail.role).not.toHaveProperty(key); expect((await accessRepository.listRoleAudit(created.objectId))[0]).toMatchObject({ action: "role.updated", reason: "ubah metadata", actorUserId: actor.userId }); });
});
