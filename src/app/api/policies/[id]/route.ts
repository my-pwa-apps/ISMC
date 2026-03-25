/**
 * GET /api/policies/[id]
 * GET /api/policies/[id]?withSettings=true
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/serverSession";
import { createRepositoryRegistry } from "@/repositories/factory";
import { PolicyInventoryService } from "@/services/policyInventoryService";
import { AuditService } from "@/services/auditService";
import { AuditAction, PolicyType } from "@/domain/enums";
import logger from "@/lib/logger";
import { z } from "zod";

const QuerySchema = z.object({
  withSettings: z.coerce.boolean().optional().default(false),
  policyType: z.nativeEnum(PolicyType).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { searchParams } = request.nextUrl;
    const query = QuerySchema.parse(Object.fromEntries(searchParams.entries()));

    const registry = createRepositoryRegistry(
      session.accessToken,
      session.tenantId ?? ""
    );
    const service = new PolicyInventoryService(registry);
    const policy = await service.getPolicy(id, query.policyType);

    // Fire-and-forget audit log
    new AuditService().log({
      tenantId: session.tenantId ?? "",
      action: AuditAction.PolicyViewed,
      entityType: "Policy",
      entityId: id,
      entityName: policy.displayName,
    }).catch(() => {});

    return NextResponse.json({ data: policy });
  } catch (err) {
    logger.error({ err, policyId: id }, "GET /api/policies/[id] failed");
    const message = err instanceof Error ? err.message : "Internal Server Error";
    if (message.includes("not found")) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
