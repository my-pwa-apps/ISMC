/**
 * GET  /api/snapshots?policyId=...  — list snapshots for a policy
 * POST /api/snapshots               — create a snapshot
 */

import { NextRequest, NextResponse } from "next/server";
import { toRouteErrorResponse } from "@/lib/api/routeErrorResponse";
import { getServerSession, requireTenantSession } from "@/lib/auth/serverSession";
import { SnapshotService } from "@/services/snapshotService";
import { createRepositoryRegistry } from "@/repositories/factory";
import { PolicyInventoryService } from "@/services/policyInventoryService";
import { SnapshotCreateSchema } from "@/lib/validation/schemas";
import logger from "@/lib/logger";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  const session = await getServerSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantSession = requireTenantSession(session);

  const policyId = request.nextUrl.searchParams.get("policyId");
  if (!policyId) {
    return NextResponse.json({ error: "policyId is required" }, { status: 400 });
  }
  if (!UUID_RE.test(policyId)) {
    return NextResponse.json({ error: "Invalid policyId" }, { status: 400 });
  }

  try {
    const service = new SnapshotService();
    const snapshots = await service.listSnapshots(policyId, tenantSession.tenantId);
    return NextResponse.json({ data: snapshots });
  } catch (err) {
    logger.error({ err }, "GET /api/snapshots failed");
    return toRouteErrorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantSession = requireTenantSession(session);

  try {
    const body = await request.json();
    const { policyId, note } = SnapshotCreateSchema.parse(body);

    const registry = createRepositoryRegistry(
      tenantSession.accessToken,
      tenantSession.tenantId,
      undefined,
      tenantSession.isDemoMode
    );
    const inventory = new PolicyInventoryService(registry, tenantSession.tenantId);
    const policy = await inventory.getPolicy(policyId);

    const snapshotService = new SnapshotService();
    const snapshot = await snapshotService.createSnapshot(policy, note, tenantSession.sub);

    return NextResponse.json({ data: snapshot }, { status: 201 });
  } catch (err) {
    logger.error({ err }, "POST /api/snapshots failed");
    return toRouteErrorResponse(err);
  }
}

