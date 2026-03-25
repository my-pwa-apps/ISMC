/**
 * Route protection middleware.
 *
 * Redirects unauthenticated users to /login for all protected routes.
 * Public routes (auth callbacks, static files) are explicitly excluded.
 *
 * We use a lightweight cookie check here rather than importing the full
 * next-auth config (which pulls in jose, incompatible with the Edge Runtime).
 * The full session validation happens in API route handlers and Server Components.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS_PREFIX = ["/login", "/api/auth", "/_next", "/favicon"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS_PREFIX.some((p) => pathname.startsWith(p));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Allow full bypass when running in mock/demo mode (local dev only)
  if (process.env.NEXT_PUBLIC_ENABLE_MOCK === "true") {
    return NextResponse.next();
  }

  // Also allow bypass via demo cookie (set by /api/auth/demo)
  const demoMode = req.cookies.get("ismc_demo_mode");
  if (demoMode?.value === "1") {
    return NextResponse.next();
  }

  // next-auth v5 beta session cookie name is "authjs.session-token" (dev)
  // or "__Secure-authjs.session-token" (production/HTTPS)
  const sessionCookie =
    req.cookies.get("authjs.session-token") ??
    req.cookies.get("__Secure-authjs.session-token");

  if (!sessionCookie) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
