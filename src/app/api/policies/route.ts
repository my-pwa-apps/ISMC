/**
 * GET /api/policies
 *
 * List all policies (or filter by type/platform/etc.)
 * Supports pagination, search, and filtering.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/serverSession";
import { createRepositoryRegistry } from "@/repositories/factory";
import { PolicyInventoryService } from "@/services/policyInventoryService";
import { PolicyListQuerySchema } from "@/lib/validation/schemas";
import logger from "@/lib/logger";
import { ZodError } from "zod";

export async function GET(request: NextRequest) {
  const session = await getServerSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const rawQuery = Object.fromEntries(searchParams.entries());
    const query = PolicyListQuerySchema.parse(rawQuery);

    const correlationId = request.headers.get("x-correlation-id") ??
      crypto.randomUUID();

    const registry = createRepositoryRegistry(
      session.accessToken,
      session.tenantId ?? "",
      correlationId
    );
    const service = new PolicyInventoryService(registry);

    const policies = query.policyType
      ? await service.listByType(query.policyType, query)
      : await service.listAll(query);

    return NextResponse.json({
      data: policies,
      meta: {
        count: policies.length,
        page: query.page,
        pageSize: query.pageSize,
      },
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "Invalid query", details: err.flatten() }, { status: 400 });
    }
    logger.error({ err }, "GET /api/policies failed");
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

