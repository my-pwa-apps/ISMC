/**
 * GET /api/reports/[type]
 * Returns a structured report for the given type.
 */

import { NextRequest, NextResponse } from "next/server";
import { toRouteErrorResponse } from "@/lib/api/routeErrorResponse";
import { getServerSession, requireTenantSession } from "@/lib/auth/serverSession";
import { createRepositoryRegistry } from "@/repositories/factory";
import { PolicyInventoryService } from "@/services/policyInventoryService";
import { ReportService } from "@/services/reportService";
import type { ReportType } from "@/domain/models";
import logger from "@/lib/logger";

const VALID_REPORT_TYPES = new Set<ReportType>([
  "unassigned-policies",
  "duplicate-policies",
  "conflicting-settings",
  "missing-scope-tags",
  "stale-policies",
  "overlapping-assignments",
  "migration-readiness",
  "settings-usage",
]);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const session = await getServerSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantSession = requireTenantSession(session);

  const { type } = await params;

  if (!VALID_REPORT_TYPES.has(type as ReportType)) {
    return NextResponse.json({ error: `Unknown report type: ${type}` }, { status: 400 });
  }

  try {
    const registry = createRepositoryRegistry(
      tenantSession.accessToken,
      tenantSession.tenantId,
      undefined,
      tenantSession.isDemoMode
    );
    const inventory = new PolicyInventoryService(registry);
    const reporter = new ReportService();

    const policies = await inventory.listAll();
    const report = await reporter.generateReport(
      type as ReportType,
      policies,
      tenantSession.tenantId
    );

    return NextResponse.json({ data: report });
  } catch (err) {
    logger.error({ err, type }, "GET /api/reports/[type] failed");
    return toRouteErrorResponse(err);
  }
}
