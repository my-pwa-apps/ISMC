/**
 * POST /api/compare
 * Body: { policyIds: string[] }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/serverSession";
import { createRepositoryRegistry } from "@/repositories/factory";
import { PolicyInventoryService } from "@/services/policyInventoryService";
import { ComparisonService } from "@/services/comparisonService";
import { CompareRequestSchema } from "@/lib/validation/schemas";
import logger from "@/lib/logger";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
  const session = await getServerSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { policyIds } = CompareRequestSchema.parse(body);

    const registry = createRepositoryRegistry(
      session.accessToken,
      session.tenantId ?? ""
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
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "Invalid request", details: err.flatten() }, { status: 400 });
    }
    logger.error({ err }, "POST /api/compare failed");
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

