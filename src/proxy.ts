import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE_NAMES } from "@/lib/auth/session-cookie";

/**
 * Sends visitors without a session cookie to sign-in before signed-in pages
 * render, keeping where they were going in `returnTo`. This is a fast path
 * only: the role gate in each route group layout is the real authorization
 * check, and API route handlers authorize every request themselves.
 */
export function proxy(request: NextRequest) {
  const hasSession = SESSION_COOKIE_NAMES.some((name) =>
    request.cookies.has(name),
  );
  if (hasSession) return NextResponse.next();

  const login = new URL("/login", request.url);
  login.searchParams.set(
    "returnTo",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/teacher/:path*", "/student/:path*"],
};
