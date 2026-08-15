import type { AccessRepository } from "./domain/types";
import { accessRepository as mockAccessRepository } from "./infrastructure/mock-adapter";
export const accessRepositories:{access:AccessRepository}={access:mockAccessRepository};
