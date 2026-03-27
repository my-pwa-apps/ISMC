import { NextRequest, NextResponse } from "next/server";
import { getServerSession, requireTenantSession } from "@/lib/auth/serverSession";
import { toRouteErrorResponse } from "@/lib/api/routeErrorResponse";
import { SnapshotRestoreSchema } from "@/lib/validation/schemas";
import { createRepositoryRegistry } from "@/repositories/factory";
import { getPolicyRepositoryForType } from "@/repositories/getPolicyRepositoryForType";
import { SnapshotService } from "@/services/snapshotService";
import { AuditService } from "@/services/auditService";
import { AuditAction } from "@/domain/enums";
import { UnsupportedPolicyOperationError } from "@/lib/errors";
import logger from "@/lib/logger";

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

  try {
    const body = await request.json();
    const { newName } = SnapshotRestoreSchema.parse(body);

    const snapshotService = new SnapshotService();
    const snapshot = await snapshotService.getSnapshot(id, tenantSession.tenantId);

    const registry = createRepositoryRegistry(
      tenantSession.accessToken,
      tenantSession.tenantId,
      undefined,
      tenantSession.isDemoMode
    );
    const repository = getPolicyRepositoryForType(registry, snapshot.policyType);

    if (!repository?.restorePolicyFromSnapshot) {
      throw new UnsupportedPolicyOperationError(
        `${snapshot.policyType} snapshots cannot be restored into a new policy yet.`
      );
    }

    const restoredPolicy = await repository.restorePolicyFromSnapshot(snapshot.snapshotData, newName);

    try {
      await new AuditService().log({
        tenantId: tenantSession.tenantId,
        actorId: tenantSession.sub,
        action: AuditAction.SnapshotRestored,
        entityType: "Policy",
        entityId: restoredPolicy.id,
        entityName: restoredPolicy.displayName,
        details: {
          sourceSnapshotId: snapshot.id,
          sourcePolicyId: snapshot.policyId,
          sourcePolicyType: snapshot.policyType,
        },
      });
    } catch (auditErr) {
      logger.warn({ auditErr, snapshotId: id }, "Failed to record snapshot restore audit entry");
    }

    return NextResponse.json({ data: restoredPolicy }, { status: 201 });
  } catch (err) {
    logger.error({ err, snapshotId: id }, "POST /api/snapshots/[id]/restore failed");
    return toRouteErrorResponse(err, "Invalid restore request");
  }
}