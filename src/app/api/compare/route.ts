/**
 * POST /api/compare
 * Body: { policyIds: string[] }
 */

import { NextRequest, NextResponse } from "next/server";
import { toRouteErrorResponse } from "@/lib/api/routeErrorResponse";
import { getServerSession, requireTenantSession } from "@/lib/auth/serverSession";
import { createRepositoryRegistry } from "@/repositories/factory";
import { PolicyInventoryService } from "@/services/policyInventoryService";
import { ComparisonService } from "@/services/comparisonService";
import { CompareRequestSchema } from "@/lib/validation/schemas";
import logger from "@/lib/logger";

export async function POST(request: NextRequest) {
  const session = await getServerSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantSession = requireTenantSession(session);

  try {
    const body = await request.json();
    const { policyIds } = CompareRequestSchema.parse(body);

    const registry = createRepositoryRegistry(
      tenantSession.accessToken,
      tenantSession.tenantId,
      undefined,
      tenantSession.isDemoMode
    );
    const inventory = new PolicyInventoryService(registry);
    const comparer = new ComparisonService();

    // Fetch all policies with settings in parallel
    const policies = await Promise.all(
      policyIds.map((id) => inventory.getPolicy(id))
    );

    const result = comparer.compare(policies);

    return NextResponse.json({ data: result });
  } catch (err) {
    logger.error({ err }, "POST /api/compare failed");
    return toRouteErrorResponse(err);
  }
}

