import { z } from "zod";

/** Opaque resource identifier. Clients must not infer meaning from it. */
export const idSchema = z.string().min(1).max(64);

/** ISO 8601 UTC timestamp string. */
export const isoDateTimeSchema = z.iso.datetime();

/** Cursor pagination query (docs/api-route.md: `?cursor=&limit=1..100`). */
export const pageQuerySchema = z.object({
  cursor: z.string().max(512).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export type PageQuery = z.infer<typeof pageQuerySchema>;

/** Converts a Zod error into the `fieldErrors` map of the API error envelope. */
export function toFieldErrors(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return fieldErrors;
}
