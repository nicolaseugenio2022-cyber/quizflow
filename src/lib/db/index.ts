import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import { getServerEnv } from "@/lib/env/server";

import { createPrismaClient } from "./create-client";

// Reuse one client across Next.js dev reloads so hot module replacement does
// not open a new connection pool on every edit.
const globalForPrisma = globalThis as typeof globalThis & {
  __quizflowPrisma?: PrismaClient;
};

/**
 * Server-only Prisma client, created on first use so that importing this
 * module during a build does not require DATABASE_URL.
 */
export function getDb(): PrismaClient {
  globalForPrisma.__quizflowPrisma ??= createPrismaClient(
    getServerEnv().DATABASE_URL,
  );
  return globalForPrisma.__quizflowPrisma;
}
