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
import { isDemoModeCookieEnabled, isServerDemoModeEnabled } from "@/lib/runtime/demoMode";

const PUBLIC_PATHS_PREFIX = ["/login", "/api/auth", "/_next", "/favicon"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS_PREFIX.some((p) => pathname.startsWith(p));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Allow full bypass when running in mock/demo mode.
  // IMPORTANT: the demo cookie check is deliberately gated behind the same
  // mock-mode flag so it cannot be exploited in production builds.
  if (isServerDemoModeEnabled()) {
    const demoMode = req.cookies.get("ismc_demo_mode");
    if (isDemoModeCookieEnabled(demoMode?.value)) {
      return NextResponse.next();
    }
  }

  // next-auth v5 beta session cookie name is "authjs.session-token" (dev)
  // or "__Secure-authjs.session-token" (production/HTTPS).
  // When the JWT exceeds 4 KB, Auth.js splits it into chunks (.0, .1, …).
  // Use prefix matching so any variant (chunked or not) is accepted.
  const hasSession = req.cookies.getAll().some(
    ({ name }) =>
      name === "authjs.session-token" ||
      name === "__Secure-authjs.session-token" ||
      name.startsWith("authjs.session-token.") ||
      name.startsWith("__Secure-authjs.session-token.")
  );

  if (!hasSession) {
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
