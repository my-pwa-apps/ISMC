import { NextRequest, NextResponse } from "next/server";
import { getServerSession, requireTenantSession } from "@/lib/auth/serverSession";
import { toRouteErrorResponse } from "@/lib/api/routeErrorResponse";
import { createRepositoryRegistry } from "@/repositories/factory";
import { PolicyInventoryService } from "@/services/policyInventoryService";
import { AuditService } from "@/services/auditService";
import { AuditAction, PolicyType } from "@/domain/enums";
import logger from "@/lib/logger";
import { z } from "zod";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const QuerySchema = z.object({
  withSettings: z.coerce.boolean().optional().default(false),
  policyType: z.nativeEnum(PolicyType).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantSession = requireTenantSession(session);

  const { id } = await params;

  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid policy ID" }, { status: 400 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const query = QuerySchema.parse(Object.fromEntries(searchParams.entries()));

    const registry = createRepositoryRegistry(
      tenantSession.accessToken,
      tenantSession.tenantId,
      undefined,
      tenantSession.isDemoMode
    );
    const service = new PolicyInventoryService(registry);
    const policy = query.withSettings
      ? await service.getPolicy(id, query.policyType)
      : await service.getPolicySummary(id, query.policyType);

    await new AuditService().log({
      tenantId: tenantSession.tenantId,
      actorId: tenantSession.sub,
      action: AuditAction.PolicyViewed,
      entityType: "Policy",
      entityId: id,
      entityName: policy.displayName,
    });

    return NextResponse.json({ data: policy });
  } catch (err) {
    logger.error({ err, policyId: id }, "GET /api/policies/[id] failed");
    return toRouteErrorResponse(err, "Invalid query");
  }
}
