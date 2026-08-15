import { describe, expect, it } from "vitest";
import { evaluateSod, normalizeAccessListQuery, permissionGroups, resolveEffectivePermissions } from "./logic";

describe("access-management domain", () => {
  it("normalizes stable list parameters", () => {
    expect(normalizeAccessListQuery({ search: "  DEWI ", statuses: ["Active", "Active"], roleIds: ["b", "a", "b"], page: -2, pageSize: 999 })).toEqual({ search: "dewi", statuses: ["Active"], roleIds: ["a", "b"], sort: "updatedAt", direction: "desc", page: 1, pageSize: 20 });
  });
  it("derives permissions from active assigned roles only", () => {
    expect(resolveEffectivePermissions(["active", "inactive"], [{ id: "active", status: "Active", permissionKeys: ["project.view"] }, { id: "inactive", status: "Inactive", permissionKeys: ["pic.approve"] }])).toEqual(["project.view"]);
  });
  it("blocks access administration combined with final approval", () => {
    expect(evaluateSod(["access.manage", "pic.approve"])[0]).toMatchObject({ ruleId: "SOD-ADMIN-FINAL-APPROVAL", blocking: true });
    expect(evaluateSod(["access.manage", "project.view"])).toEqual([]);
  });
  it("groups the permission catalog for a matrix", () => {
    expect(Object.keys(permissionGroups()).sort()).toEqual(["Access", "Approval", "Project"]);
  });
});
