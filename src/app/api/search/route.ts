/**
 * POST /api/search
 * Body: SearchQuery
 */

import { NextRequest, NextResponse } from "next/server";
import { toRouteErrorResponse } from "@/lib/api/routeErrorResponse";
import { getServerSession, requireTenantSession } from "@/lib/auth/serverSession";
import { createRepositoryRegistry } from "@/repositories/factory";
import { PolicyInventoryService } from "@/services/policyInventoryService";
import { SearchService } from "@/services/searchService";
import { SearchQuerySchema } from "@/lib/validation/schemas";
import { paginateItems } from "@/lib/pagination";
import logger from "@/lib/logger";

export async function POST(request: NextRequest) {
  const session = await getServerSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantSession = requireTenantSession(session);

  try {
    const startedAt = Date.now();
    const body = await request.json();
    const query = SearchQuerySchema.parse(body);

    const registry = createRepositoryRegistry(
      tenantSession.accessToken,
      tenantSession.tenantId,
      undefined,
      tenantSession.isDemoMode
    );
    const inventory = new PolicyInventoryService(registry, tenantSession.tenantId);
    const searcher = new SearchService();

    const policies = await inventory.listAll();
    const results = searcher.search(policies, query);
    const page = paginateItems(results, {
      page: query.page,
      pageSize: query.pageSize,
      cursor: query.cursor,
    });

    return NextResponse.json({
      data: page.data,
      meta: {
        ...page.meta,
        query: query.text,
        durationMs: Date.now() - startedAt,
      },
    });
  } catch (err) {
    logger.error({ err }, "POST /api/search failed");
    return toRouteErrorResponse(err, "Invalid search query");
  }
}

