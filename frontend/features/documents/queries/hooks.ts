"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryKey } from "@tanstack/react-query";
import { normalizeOrRethrowAppError, type AppError } from "@/features/foundation/domain/errors";
import type { DocumentObjectType } from "@/features/foundation/domain/models";
import { repositories } from "@/features/foundation/repositories";
import { queryKeys } from "@/lib/query-keys";
import { normalizeDocumentListQuery } from "../domain/validation";
import type {
  CreateDocumentCommand,
  CreateDocumentVersionCommand,
  DocumentDetail,
  DocumentListQuery,
  DocumentListResult,
  DocumentMutationResult,
  TransitionDocumentVersionCommand,
} from "../domain/types";

const safe = async <T,>(fn: () => Promise<T>) => {
  try {
    return await fn();
  } catch (error) {
    throw normalizeOrRethrowAppError(error);
  }
};

export function documentInvalidationKeys(result: DocumentMutationResult): QueryKey[] {
  const keys: QueryKey[] = [
    queryKeys.documents.owner(result.owner.objectType, result.owner.objectId),
    queryKeys.documents.detail(result.documentId),
    queryKeys.documents.versions(result.documentId),
    queryKeys.documents.readiness(result.owner.objectType, result.owner.objectId),
    queryKeys.documents.byObject(result.owner.objectType, result.owner.objectId),
    queryKeys.audit.byObject("Document", result.documentId),
    queryKeys.projects.detail(result.owner.projectId),
    queryKeys.projects.readiness(result.owner.projectId),
  ];
  if (result.owner.objectType === "RateVersion") {
    keys.push(queryKeys.rates.detail(result.owner.projectId, result.owner.objectId));
    keys.push(queryKeys.rates.readiness(result.owner.projectId, result.owner.objectId));
  }
  return keys;
}

export function useDocumentList(type: DocumentObjectType, id: string, input: DocumentListQuery, enabled = true) {
  const normalized = normalizeDocumentListQuery(input);
  return useQuery<DocumentListResult, AppError>({
    queryKey: queryKeys.documents.list(type, id, normalized),
    enabled,
    queryFn: ({ signal }) => safe(() => repositories.documents.listByOwner(type, id, normalized, signal)),
  });
}

export function useDocumentDetail(id: string, enabled = true) {
  return useQuery<DocumentDetail, AppError>({
    queryKey: queryKeys.documents.detail(id),
    enabled,
    queryFn: ({ signal }) => safe(() => repositories.documents.getDocument(id, signal)),
  });
}

function useDocumentMutation<T>(fn: (command: T) => Promise<DocumentMutationResult>) {
  const client = useQueryClient();
  return useMutation<DocumentMutationResult, AppError, T>({
    mutationFn: (command) => safe(() => fn(command)),
    onSuccess: async (result) => {
      await Promise.all(documentInvalidationKeys(result).map((queryKey) => client.invalidateQueries({ queryKey })));
    },
  });
}

export function useCreateDocument() {
  return useDocumentMutation<CreateDocumentCommand>((command) => repositories.documents.createDocument(command));
}

export function useCreateDocumentVersion() {
  return useDocumentMutation<CreateDocumentVersionCommand>((command) => repositories.documents.createVersion(command));
}

export function useTransitionDocumentVersion() {
  return useDocumentMutation<TransitionDocumentVersionCommand>((command) => repositories.documents.transitionVersionStatus(command));
}
