/**
 * GET  /api/snapshots?policyId=...  — list snapshots for a policy
 * POST /api/snapshots               — create a snapshot
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/serverSession";
import { SnapshotService } from "@/services/snapshotService";
import { createRepositoryRegistry } from "@/repositories/factory";
import { PolicyInventoryService } from "@/services/policyInventoryService";
import { SnapshotCreateSchema } from "@/lib/validation/schemas";
import logger from "@/lib/logger";
import { ZodError } from "zod";
import { z } from "zod";

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const policyId = request.nextUrl.searchParams.get("policyId");
  if (!policyId) {
    return NextResponse.json({ error: "policyId is required" }, { status: 400 });
  }

  const service = new SnapshotService();
  const snapshots = await service.listSnapshots(policyId);
  return NextResponse.json({ data: snapshots });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { policyId, note } = SnapshotCreateSchema.parse(body);

    const registry = createRepositoryRegistry(session.accessToken, session.tenantId ?? "");
    const inventory = new PolicyInventoryService(registry);
    const policy = await inventory.getPolicy(policyId);

    const snapshotService = new SnapshotService();
    const snapshot = await snapshotService.createSnapshot(policy, note);

    return NextResponse.json({ data: snapshot }, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "Invalid request", details: err.flatten() }, { status: 400 });
    }
    logger.error({ err }, "POST /api/snapshots failed");
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

