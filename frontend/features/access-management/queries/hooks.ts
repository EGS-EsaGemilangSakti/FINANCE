"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { normalizeOrRethrowAppError, type AppError } from "@/features/foundation/domain/errors";
import type { PaginatedResult } from "@/features/foundation/repositories/contracts";
import { queryKeys } from "@/lib/query-keys";
import { normalizeAccessListQuery } from "../domain/logic";
import type { AccessAudit, AccessListQuery, AccessMutationResult, LifecycleCommand, PermissionDefinition, RoleCommand, RoleDetail, RoleListItem, UserCommand, UserDetail, UserListItem } from "../domain/types";
import { accessRepositories } from "../repositories";

const repository = accessRepositories.access;
const safe = async <T,>(operation: () => Promise<T>) => { try { return await operation(); } catch (error) { throw normalizeOrRethrowAppError(error); } };
export const useAccessUsers = (input: AccessListQuery, enabled = true) => { const query = normalizeAccessListQuery(input); return useQuery<PaginatedResult<UserListItem>, AppError>({ queryKey: queryKeys.access.users.list(query), enabled, queryFn: ({ signal }) => safe(() => repository.listUsers(query, signal)) }); };
export const useAccessUser = (id: string, enabled = true) => useQuery<UserDetail, AppError>({ queryKey: queryKeys.access.users.detail(id), enabled, queryFn: ({ signal }) => safe(() => repository.getUser(id, signal)) });
export const useUserAudit = (id: string, enabled = true) => useQuery<readonly AccessAudit[], AppError>({ queryKey: queryKeys.access.users.audit(id), enabled, queryFn: ({ signal }) => safe(() => repository.listUserAudit(id, signal)) });
export const useAccessRoles = (input: AccessListQuery = {}, enabled = true) => { const query = normalizeAccessListQuery(input); return useQuery<PaginatedResult<RoleListItem>, AppError>({ queryKey: queryKeys.access.roles.list(query), enabled, queryFn: ({ signal }) => safe(() => repository.listRoles(query, signal)) }); };
export const useAccessRole = (id: string, enabled = true) => useQuery<RoleDetail, AppError>({ queryKey: queryKeys.access.roles.detail(id), enabled, queryFn: ({ signal }) => safe(() => repository.getRole(id, signal)) });
export const useRoleAudit = (id: string, enabled = true) => useQuery<readonly AccessAudit[], AppError>({ queryKey: queryKeys.access.roles.audit(id), enabled, queryFn: ({ signal }) => safe(() => repository.listRoleAudit(id, signal)) });
export const usePermissionCatalog = (enabled = true) => useQuery<readonly PermissionDefinition[], AppError>({ queryKey: queryKeys.access.permissions, enabled, queryFn: ({ signal }) => safe(() => repository.listPermissions(signal)), staleTime: 300_000 });

function useAccessMutation<T>(operation: (command: T, signal: AbortSignal) => Promise<AccessMutationResult>, affected: "users" | "roles") {
  const client = useQueryClient();
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controller.current?.abort(); }; }, []);
  const mutation = useMutation<AccessMutationResult, AppError, T>({
    mutationFn: command => { controller.current?.abort(); const current = new AbortController(); controller.current = current; if (!mounted.current) current.abort(); return safe(() => operation(command, current.signal)).finally(() => { if (controller.current === current) controller.current = null; }); },
    onSuccess: result => {
      if (!mounted.current) return;
      const entityKeys = affected === "users" ? queryKeys.access.users : queryKeys.access.roles;
      void client.invalidateQueries({ queryKey: entityKeys.all });
      void client.invalidateQueries({ queryKey: entityKeys.detail(result.objectId) });
      void client.invalidateQueries({ queryKey: affected === "users" ? queryKeys.access.users.audit(result.objectId) : queryKeys.access.roles.audit(result.objectId) });
      void client.invalidateQueries({ queryKey: affected === "users" ? queryKeys.access.roles.all : queryKeys.access.users.all });
    },
  });
  return { ...mutation, cancel: () => controller.current?.abort() };
}

export const useSaveUser = () => useAccessMutation<UserCommand>((command, signal) => repository.saveUser(command, signal), "users");
export const useUserLifecycle = () => useAccessMutation<LifecycleCommand>((command, signal) => repository.setUserStatus(command, signal), "users");
export const useSaveRole = () => useAccessMutation<RoleCommand>((command, signal) => repository.saveRole(command, signal), "roles");
export const useRoleLifecycle = () => useAccessMutation<LifecycleCommand>((command, signal) => repository.setRoleStatus(command, signal), "roles");
