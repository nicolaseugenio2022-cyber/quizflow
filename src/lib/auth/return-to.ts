const BASE = "http://quizflow.invalid";

/**
 * Accepts only same-origin relative paths for post-login redirects
 * (docs/api-route.md: "validated local returnTo destination").
 */
export function safeReturnTo(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  // Reject control characters and backslashes, which browsers may treat as
  // "/" and turn "/\evil.example" into a protocol-relative URL.
  if (/[\u0000-\u001f\\]/.test(value)) return null;
  try {
    const url = new URL(value, BASE);
    if (url.origin !== BASE) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
