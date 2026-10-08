import { z } from "zod";

/**
 * Server environment contract. Values are read on the server only and are
 * never prefixed with NEXT_PUBLIC_, so Next.js cannot inline them into the
 * browser bundle.
 */
export const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z
    .string({ error: "DATABASE_URL is required." })
    .trim()
    .min(1, "DATABASE_URL is required.")
    .refine(
      (value) => /^postgres(ql)?:\/\//.test(value),
      "DATABASE_URL must be a PostgreSQL connection string.",
    ),
  /** Public origin used to build absolute links such as QR join URLs. */
  APP_URL: z.url().optional(),
  /**
   * Development-only test accounts (src/lib/auth/dev-credentials-adapter.ts).
   * Ignored when NODE_ENV is "production".
   */
  TEACHER_USERNAME: z.email().optional(),
  TEACHER_PASSWORD: z.string().min(1).optional(),
  STUDENT_USERNAME: z.email().optional(),
  STUDENT_PASSWORD: z.string().min(1).optional(),
  AUTH_DEV_SESSION_SECRET: z.string().min(32).optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Parses the environment and throws a message that names invalid variables
 * without echoing their values.
 */
export function parseServerEnv(
  source: Record<string, string | undefined>,
): ServerEnv {
  const result = serverEnvSchema.safeParse(source);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `- ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid server environment:\n${problems}`);
  }
  return result.data;
}
