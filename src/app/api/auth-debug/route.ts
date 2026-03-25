/**
 * GET /api/auth-debug
 * TEMPORARY: Returns the names (never values) of all cookies present in the
 * request.  Used to diagnose the auth sign-in loop on CF Pages.
 * Remove this endpoint after the auth issue is confirmed fixed.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const names = cookieStore.getAll().map((c) => c.name);
  const authCookies = names.filter(
    (n) =>
      n.includes("authjs") ||
      n.includes("session") ||
      n.includes("csrf") ||
      n.includes("callback") ||
      n.includes("pkce") ||
      n.includes("state")
  );
  return NextResponse.json({
    allCookieNames: names,
    authRelatedCookies: authCookies,
    hasSession:
      names.some(
        (n) =>
          n === "authjs.session-token" ||
          n === "__Secure-authjs.session-token" ||
          n.startsWith("authjs.session-token.") ||
          n.startsWith("__Secure-authjs.session-token.")
      ),
  });
}
