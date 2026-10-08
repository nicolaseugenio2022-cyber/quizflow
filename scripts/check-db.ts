/**
 * Database check: `npm run db:check` (also runs before `npm run dev`).
 *
 * Confirms DATABASE_URL is valid and PostgreSQL answers a minimal query, then
 * reports migration status. It never prints the connection string, host,
 * user or password. Exit code 0 on success, 1 on failure.
 */
import "dotenv/config";

import { createPrismaClient } from "../src/lib/db/create-client";
import { parseServerEnv } from "../src/lib/env/schema";

/** Collects `code` values from an error and its causes without reading messages. */
function errorCodes(error: unknown): string[] {
  const codes: string[] = [];
  let current: unknown = error;
  for (let depth = 0; current && depth < 5; depth += 1) {
    if (typeof current === "object" && current !== null) {
      const { code, cause } = current as { code?: unknown; cause?: unknown };
      if (typeof code === "string") codes.push(code);
      current = cause;
    } else {
      break;
    }
  }
  return codes;
}

function explain(error: unknown): string {
  const codes = errorCodes(error);
  // The message is inspected but never printed: it can contain the host.
  const message = error instanceof Error ? error.message : "";
  const has = (...candidates: string[]) =>
    candidates.some((candidate) => codes.includes(candidate));

  if (
    has("ECONNREFUSED", "P1001", "ENOTFOUND", "ETIMEDOUT", "P1002") ||
    /can't reach database server|ECONNREFUSED|ENOTFOUND|timed out/i.test(
      message,
    )
  ) {
    return "PostgreSQL is not reachable. Start your PostgreSQL server, then run the command again.";
  }
  if (
    has("28P01", "28000", "P1000") ||
    /authentication failed/i.test(message)
  ) {
    return "PostgreSQL rejected the user name or password in DATABASE_URL.";
  }
  if (has("3D000", "P1003") || /database .* does not exist/i.test(message)) {
    return "The database named in DATABASE_URL does not exist. Create it, then run the command again.";
  }
  return `Could not query PostgreSQL${codes.length ? ` (${codes.join(", ")})` : ""}. Check DATABASE_URL in .env.`;
}

async function main(): Promise<number> {
  let env;
  try {
    env = parseServerEnv(process.env);
  } catch (error) {
    // parseServerEnv names invalid variables without echoing values.
    console.error(`[db] ${(error as Error).message}`);
    console.error("[db] Copy .env.example to .env and set DATABASE_URL.");
    return 1;
  }

  const db = createPrismaClient(env.DATABASE_URL, { quiet: true });
  try {
    const [{ version }] = await db.$queryRaw<{ version: string }[]>`
      SELECT current_setting('server_version') AS version`;

    const [{ hasTable }] = await db.$queryRaw<{ hasTable: boolean }[]>`
      SELECT to_regclass('public._prisma_migrations') IS NOT NULL AS "hasTable"`;
    let migrations = "no migrations applied yet";
    if (hasTable) {
      const [{ applied }] = await db.$queryRaw<{ applied: number }[]>`
        SELECT count(*)::int AS applied
        FROM public._prisma_migrations
        WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`;
      migrations = `${applied} migration${applied === 1 ? "" : "s"} applied`;
    }

    console.log(`[db] PostgreSQL ${version} reachable, ${migrations}.`);
    return 0;
  } catch (error) {
    console.error(`[db] ${explain(error)}`);
    return 1;
  } finally {
    await db.$disconnect().catch(() => {});
  }
}

main().then((code) => {
  process.exitCode = code;
});
