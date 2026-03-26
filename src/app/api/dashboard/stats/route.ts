/**
 * GET  /api/dashboard/stats
 * Returns KPI data for the dashboard.
 */

import { NextRequest, NextResponse } from "next/server";
import { toRouteErrorResponse } from "@/lib/api/routeErrorResponse";
import { getServerSession, requireTenantSession } from "@/lib/auth/serverSession";
import { createRepositoryRegistry } from "@/repositories/factory";
import { PolicyInventoryService } from "@/services/policyInventoryService";
import logger from "@/lib/logger";

export async function GET(request: NextRequest) {
  const session = await getServerSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantSession = requireTenantSession(session);

  try {
    const registry = createRepositoryRegistry(
      tenantSession.accessToken,
      tenantSession.tenantId,
      undefined,
      tenantSession.isDemoMode
    );
    const service = new PolicyInventoryService(registry);
    const stats = await service.getDashboardStats();

    return NextResponse.json({ data: stats });
  } catch (err) {
    logger.error({ err }, "GET /api/dashboard/stats failed");
    return toRouteErrorResponse(err);
  }
}

