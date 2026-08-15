import { describe, expect, it } from "vitest";
import { AppError } from "@/features/foundation/domain/errors";
import { mapAccessMutationError } from "./mutation-error";

describe("mapAccessMutationError", () => {
  it("maps known and unknown fields without losing correlation", () => { const result = mapAccessMutationError(new AppError(422, "INVALID", "Periksa data.", { email: ["Tidak valid."], internal: ["Nilai ditolak."] }, false, "corr-422")); expect(result.fieldErrors.email).toEqual(["Tidak valid."]); expect(result.globalErrors).toEqual(["internal: Nilai ditolak."]); expect(result.correlationId).toBe("corr-422"); });
  it("parses conflict and SoD metadata safely", () => { const conflict = mapAccessMutationError(new AppError(409, "STALE", "Berubah.", {}, false, "corr", { userVersion: 1, latestVersion: 2, diffs: [{ field: "name", label: "Nama", before: "A", after: "B" }] })); expect(conflict.conflict?.latestVersion).toBe(2); });
  it("sanitizes unknown errors and preserves cancellation", () => { expect(mapAccessMutationError(new Error("database secret"))).toMatchObject({ code: "UNEXPECTED_ERROR", retryable: true }); expect(() => mapAccessMutationError(new DOMException("stop", "AbortError"))).toThrowError(DOMException); });
});
