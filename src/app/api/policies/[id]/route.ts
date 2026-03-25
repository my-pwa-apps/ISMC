import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/serverSession";
import { createRepositoryRegistry } from "@/repositories/factory";
import { PolicyInventoryService } from "@/services/policyInventoryService";
import { AuditService } from "@/services/auditService";
import { PolicyNotFoundError } from "@/lib/errors";
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

  const { id } = await params;

  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid policy ID" }, { status: 400 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const query = QuerySchema.parse(Object.fromEntries(searchParams.entries()));

    const registry = createRepositoryRegistry(
      session.accessToken,
      session.tenantId ?? ""
    );
    const service = new PolicyInventoryService(registry);
    const policy = await service.getPolicy(id, query.policyType);

    // Fire-and-forget audit log with actor identity
    new AuditService().log({
      tenantId: session.tenantId ?? "",
      actorId: session.sub,
      action: AuditAction.PolicyViewed,
      entityType: "Policy",
      entityId: id,
      entityName: policy.displayName,
    }).catch(() => {});

    return NextResponse.json({ data: policy });
  } catch (err) {
    if (err instanceof PolicyNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    logger.error({ err, policyId: id }, "GET /api/policies/[id] failed");
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
