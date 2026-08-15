import type { RepositoryRegistry } from "./contracts";
import { masterDataManagement,mockRepositories } from "../infrastructure/mock/adapter";

// Composition root. Replace this binding with a verified API adapter when the backend contract exists.
Object.assign(mockRepositories.masterData,masterDataManagement);
export const repositories: RepositoryRegistry = mockRepositories;
export type * from "./contracts";
