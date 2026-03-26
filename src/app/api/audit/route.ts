/**
 * GET  /api/audit         — list audit entries
 * POST /api/audit         — (internal) write audit entry
 */

import { NextRequest, NextResponse } from "next/server";
import { toRouteErrorResponse } from "@/lib/api/routeErrorResponse";
import { getServerSession, requireTenantSession } from "@/lib/auth/serverSession";
import { AuditService } from "@/services/auditService";
import logger from "@/lib/logger";
import { z } from "zod";

const ListQuerySchema = z.object({
  entityId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantSession = requireTenantSession(session);

  try {
    const { searchParams } = request.nextUrl;
    const query = ListQuerySchema.parse(Object.fromEntries(searchParams.entries()));

    const service = new AuditService();
    const { records, total } = await service.list(tenantSession.tenantId, {
      entityId: query.entityId,
      limit: query.limit,
      offset: query.offset,
    });

    return NextResponse.json({
      data: records,
      meta: { total, limit: query.limit, offset: query.offset },
    });
  } catch (err) {
    logger.error({ err }, "GET /api/audit failed");
    return toRouteErrorResponse(err, "Invalid query");
  }
}

