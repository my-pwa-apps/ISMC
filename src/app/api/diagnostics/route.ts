/**
 * GET /api/diagnostics
 * Returns tenant and permission diagnostics.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/serverSession";
import { annotatePermissions } from "@/lib/auth/permissions";
import type { TenantDiagnostics } from "@/domain/models";

export async function GET(request: NextRequest) {
  const session = await getServerSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Decode the access token claims (without verification — for display only)
  let tokenClaims: Record<string, unknown> = {};
  try {
    const parts = session.accessToken.split(".");
    if (parts.length === 3) {
      tokenClaims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
    }
  } catch {
    // Non-fatal
  }

  const scopes = (tokenClaims.scp as string) ?? "";
  const permissions = annotatePermissions(scopes);

  const diagnostics: TenantDiagnostics = {
    tenantId: session.tenantId ?? (tokenClaims.tid as string) ?? "unknown",
    tenantName: (tokenClaims.tenant_display_name as string) ?? undefined,
    currentUser: {
      id: (tokenClaims.oid as string) ?? "unknown",
      displayName: (tokenClaims.name as string) ?? "Unknown User",
      email: (tokenClaims.preferred_username as string) ?? undefined,
    },
    graphPermissions: permissions,
    betaEndpointsAvailable: true, // we always attempt beta; handle errors at repository level
    writeOperationsEnabled: process.env.ENABLE_WRITE_OPERATIONS === "true",
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT ?? "development",
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.0",
    checkedAt: new Date().toISOString(),
  };

  return NextResponse.json({ data: diagnostics });
}

