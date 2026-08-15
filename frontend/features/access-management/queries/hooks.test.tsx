import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { StrictMode, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { LifecycleCommand, RoleCommand, UserCommand } from "../domain/types";
import { queryKeys } from "@/lib/query-keys";
import { accessRepositories } from "../repositories";
import { useRoleLifecycle, useSaveRole, useSaveUser, useUserLifecycle } from "./hooks";

const command: RoleCommand = { data: { code: "SIGNAL_TEST", name: "Signal", description: "Signal", permissionKeys: ["access.view"] }, reason: "uji signal", actor: { userId: "usr-dewi", permissionKeys: ["access.manage"] } };
const success = { objectType: "Role" as const, objectId: "role-ok", version: 1, message: "ok", correlationId: "corr-ok" };
const userCommand: UserCommand = { data: { employeeId: "EMP-SIGNAL", name: "Signal User", email: "signal@example.test", roleIds: ["role-view"], projectScopeIds: [] }, reason: "uji signal", actor: command.actor };
const lifecycleCommand: LifecycleCommand = { objectId: "object-signal", currentVersion: 1, target: "Inactive", reason: "uji signal", actor: command.actor };

describe("access mutation Strict Mode ownership", () => {
  it("reactivates after setup-cleanup-setup, aborts on unmount, then uses a fresh signal", async () => {
    const signals: AbortSignal[] = [];
    const spy = vi.spyOn(accessRepositories.access, "saveRole").mockImplementation((_value, signal) => new Promise((resolve, reject) => { if (!signal) return reject(new Error("signal missing")); signals.push(signal); if (signal.aborted) return reject(new DOMException("stop", "AbortError")); signal.addEventListener("abort", () => reject(new DOMException("stop", "AbortError")), { once: true }); if (signals.length !== 2) resolve(success); }));
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } }), invalidate = vi.spyOn(client, "invalidateQueries");
    const wrapper = ({ children }: { children: ReactNode }) => <StrictMode><QueryClientProvider client={client}>{children}</QueryClientProvider></StrictMode>;
    const hook = renderHook(() => useSaveRole(), { wrapper });
    await act(async () => { await hook.result.current.mutateAsync(command); }); expect(signals[0]?.aborted).toBe(false);
    let abortedPromise: Promise<unknown>; act(() => { abortedPromise = hook.result.current.mutateAsync(command); }); const observedAbort = abortedPromise!.catch(error => error); await waitFor(() => expect(signals).toHaveLength(2)); hook.unmount();
    await expect(observedAbort).resolves.toMatchObject({ name: "AbortError" }); expect(signals[1]?.aborted).toBe(true);
    const fresh = renderHook(() => useSaveRole(), { wrapper }); await act(async () => { await fresh.result.current.mutateAsync(command); }); expect(signals[2]).not.toBe(signals[1]); expect(signals[2]?.aborted).toBe(false);
    expect(invalidate).toHaveBeenCalledTimes(8); spy.mockRestore();
  });

  it("aborts the owned request before a concurrent programmatic mutation", async () => {
    const signals: AbortSignal[] = [];
    const spy = vi.spyOn(accessRepositories.access, "saveRole").mockImplementation((_value, signal) => new Promise((resolve, reject) => { if (!signal) return; signals.push(signal); signal.addEventListener("abort", () => reject(new DOMException("superseded", "AbortError")), { once: true }); if (signals.length === 2) resolve(success); }));
    const client = new QueryClient(), invalidate = vi.spyOn(client, "invalidateQueries"), wrapper = ({ children }: { children: ReactNode }) => <StrictMode><QueryClientProvider client={client}>{children}</QueryClientProvider></StrictMode>, hook = renderHook(() => useSaveRole(), { wrapper });
    let first: Promise<unknown>; act(() => { first = hook.result.current.mutateAsync(command); }); const observedFirst = first!.catch(error => error); await waitFor(() => expect(signals).toHaveLength(1));
    await act(async () => { await hook.result.current.mutateAsync(command); }); await expect(observedFirst).resolves.toMatchObject({ name: "AbortError" }); expect(signals[0]?.aborted).toBe(true); expect(signals[1]?.aborted).toBe(false); expect(invalidate).toHaveBeenCalledTimes(4); expect(invalidate.mock.calls.map(([options]) => options?.queryKey)).toEqual([queryKeys.access.roles.all, queryKeys.access.roles.detail(success.objectId), queryKeys.access.roles.audit(success.objectId), queryKeys.access.users.all]); spy.mockRestore();
  });

  it("passes a fresh signal through every mutation hook and targets cross-domain invalidation", async () => {
    const signals: AbortSignal[] = [];
    const capture = async (_value: unknown, signal?: AbortSignal) => { if (!signal) throw new Error("signal missing"); signals.push(signal); return success; };
    const spies = [vi.spyOn(accessRepositories.access, "saveUser").mockImplementation(capture), vi.spyOn(accessRepositories.access, "setUserStatus").mockImplementation(capture), vi.spyOn(accessRepositories.access, "saveRole").mockImplementation(capture), vi.spyOn(accessRepositories.access, "setRoleStatus").mockImplementation(capture)];
    const client = new QueryClient(), invalidate = vi.spyOn(client, "invalidateQueries"), wrapper = ({ children }: { children: ReactNode }) => <StrictMode><QueryClientProvider client={client}>{children}</QueryClientProvider></StrictMode>;
    const saveUser = renderHook(() => useSaveUser(), { wrapper }), userLifecycle = renderHook(() => useUserLifecycle(), { wrapper }), saveRole = renderHook(() => useSaveRole(), { wrapper }), roleLifecycle = renderHook(() => useRoleLifecycle(), { wrapper });
    await act(async () => { await saveUser.result.current.mutateAsync(userCommand); await userLifecycle.result.current.mutateAsync(lifecycleCommand); await saveRole.result.current.mutateAsync(command); await roleLifecycle.result.current.mutateAsync(lifecycleCommand); });
    expect(signals).toHaveLength(4); expect(new Set(signals).size).toBe(4); expect(signals.every(signal => !signal.aborted)).toBe(true); expect(invalidate).toHaveBeenCalledTimes(16);
    const keys = invalidate.mock.calls.map(([options]) => options?.queryKey), userKeys = [queryKeys.access.users.all, queryKeys.access.users.detail(success.objectId), queryKeys.access.users.audit(success.objectId), queryKeys.access.roles.all], roleKeys = [queryKeys.access.roles.all, queryKeys.access.roles.detail(success.objectId), queryKeys.access.roles.audit(success.objectId), queryKeys.access.users.all];
    expect(keys.slice(0, 4)).toEqual(userKeys); expect(keys.slice(4, 8)).toEqual(userKeys); expect(keys.slice(8, 12)).toEqual(roleKeys); expect(keys.slice(12, 16)).toEqual(roleKeys); spies.forEach(spy => spy.mockRestore());
  });
});
