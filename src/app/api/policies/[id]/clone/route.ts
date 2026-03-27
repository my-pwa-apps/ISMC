import { NextRequest, NextResponse } from "next/server";
import { getServerSession, requireTenantSession } from "@/lib/auth/serverSession";
import { toRouteErrorResponse } from "@/lib/api/routeErrorResponse";
import { PolicyCloneSchema } from "@/lib/validation/schemas";
import { createRepositoryRegistry } from "@/repositories/factory";
import { getPolicyRepositoryForType } from "@/repositories/getPolicyRepositoryForType";
import { PolicyInventoryService } from "@/services/policyInventoryService";
import { AuditService } from "@/services/auditService";
import { AuditAction } from "@/domain/enums";
import { UnsupportedPolicyOperationError } from "@/lib/errors";
import logger from "@/lib/logger";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
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
    const body = await request.json();
    const { newName, policyType } = PolicyCloneSchema.parse(body);

    const registry = createRepositoryRegistry(
      tenantSession.accessToken,
      tenantSession.tenantId,
      undefined,
      tenantSession.isDemoMode
    );
    const inventory = new PolicyInventoryService(registry);
    const sourcePolicy = await inventory.getPolicySummary(id, policyType);
    const repository = getPolicyRepositoryForType(registry, sourcePolicy.policyType);

    if (!repository?.clonePolicy) {
      throw new UnsupportedPolicyOperationError(
        `${sourcePolicy.policyType} policies do not support create-from-existing yet.`
      );
    }

    const clonedPolicy = await repository.clonePolicy(id, newName);

    try {
      await new AuditService().log({
        tenantId: tenantSession.tenantId,
        actorId: tenantSession.sub,
        action: AuditAction.PolicyCloned,
        entityType: "Policy",
        entityId: clonedPolicy.id,
        entityName: clonedPolicy.displayName,
        details: {
          sourcePolicyId: sourcePolicy.id,
          sourcePolicyType: sourcePolicy.policyType,
        },
      });
    } catch (auditErr) {
      logger.warn({ auditErr, policyId: id }, "Failed to record policy clone audit entry");
    }

    return NextResponse.json({ data: clonedPolicy }, { status: 201 });
  } catch (err) {
    logger.error({ err, policyId: id }, "POST /api/policies/[id]/clone failed");
    return toRouteErrorResponse(err, "Invalid clone request");
  }
}