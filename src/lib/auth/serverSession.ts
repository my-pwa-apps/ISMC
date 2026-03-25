/**
 * Server session helper.
 *
 * In mock mode (NEXT_PUBLIC_ENABLE_MOCK=true) returns a synthetic session
 * so API routes work without a real Microsoft Entra ID sign-in.
 */

import { auth } from "@/lib/auth/config";

const MOCK_SESSION = {
  user: { name: "Demo User", email: "demo@example.com" },
  accessToken: "mock-access-token",
  tenantId: "00000000-0000-0000-0000-000000000000",
  expires: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
} as const;

export async function getServerSession() {
  if (process.env.NEXT_PUBLIC_ENABLE_MOCK === "true") {
    return MOCK_SESSION;
  }
  return auth();
}
