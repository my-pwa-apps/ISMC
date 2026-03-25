/**
 * GET  /api/dashboard/stats
 * Returns KPI data for the dashboard.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/serverSession";
import { createRepositoryRegistry } from "@/repositories/factory";
import { PolicyInventoryService } from "@/services/policyInventoryService";
import logger from "@/lib/logger";

export async function GET() {
  const session = await getServerSession();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const registry = createRepositoryRegistry(
      session.accessToken,
      session.tenantId ?? ""
    );
    const service = new PolicyInventoryService(registry);
    const stats = await service.getDashboardStats();

    return NextResponse.json({ data: stats });
  } catch (err) {
    logger.error({ err }, "GET /api/dashboard/stats failed");
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

