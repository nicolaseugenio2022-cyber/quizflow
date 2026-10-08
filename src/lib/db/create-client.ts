import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

/**
 * Builds a Prisma client on the node-postgres driver adapter.
 * Application code should import `db` from "@/lib/db" instead; this factory
 * exists for scripts that run outside Next.js.
 */
export function createPrismaClient(
  connectionString: string,
  options: { quiet?: boolean } = {},
): PrismaClient {
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
    log: options.quiet
      ? []
      : process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });
}
