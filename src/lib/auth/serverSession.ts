/**
 * Server-side token accessor for API route handlers.
 *
 * SECURITY DESIGN:
 *  - The Graph access token is NEVER exposed in the public session
 *    (/api/auth/session) or returned to useSession() on the client.
 *  - API routes use this helper which reads the encrypted JWT cookie
 *    directly via getToken(), bypassing the session callback entirely.
 *  - This module must only be imported in server-side code (API routes,
 *    server components). Never import it in client components.
 */

import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import logger from "@/lib/logger";

export interface ServerAuth {
  /** Live Microsoft Graph access token — server-side only. */
  accessToken: string;
  /** Entra tenant ID extracted from the ID token `tid` claim. */
  tenantId?: string;
  /** User object ID (OID) — use as actorId in audit logs. */
  sub?: string;
  /** Set when token refresh failed. */
  error?: string;
}

const MOCK_AUTH: ServerAuth = {
  accessToken: "mock-access-token",
  tenantId: "00000000-0000-0000-0000-000000000000",
  sub: "demo-user-id",
  error: undefined,
};

/**
 * Returns the server-side auth context for the current request, including the
 * raw Graph access token.
 *
 * Returns null if the request is unauthenticated or the session cookie is
 * missing / invalid.
 */
export async function getServerSession(
  request: NextRequest
): Promise<ServerAuth | null> {
  if (process.env.NEXT_PUBLIC_ENABLE_MOCK === "true") {
    return MOCK_AUTH;
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    logger.error("AUTH_SECRET is not configured — cannot validate session");
    return null;
  }

  try {
    // In production (HTTPS), Auth.js names the cookie __Secure-authjs.session-token.
    // getToken() defaults secureCookie=false which looks for the non-secure name,
    // causing decryption to fail (salt = cookieName → wrong key derivation).
    // Explicitly detect HTTPS from the request URL so both names work correctly.
    const isHttps = request.url.startsWith("https://");
    const cookieName = isHttps
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";

    const token = await getToken({
      req: request,
      secret,
      secureCookie: isHttps,
      cookieName,
      salt: cookieName, // Auth.js v5: salt must equal cookieName (key derivation)
    });

    if (!token?.accessToken) return null;

    return {
      accessToken: token.accessToken as string,
      tenantId: token.tenantId as string | undefined,
      sub: token.sub,
      error: token.error as string | undefined,
    };
  } catch {
    // Cookie decode failure (invalid secret, expired, etc.)
    return null;
  }
}
