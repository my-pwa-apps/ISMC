/**
 * POST /api/search
 * Body: SearchQuery
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/serverSession";
import { createRepositoryRegistry } from "@/repositories/factory";
import { PolicyInventoryService } from "@/services/policyInventoryService";
import { SearchService } from "@/services/searchService";
import { SearchQuerySchema } from "@/lib/validation/schemas";
import { InvalidCursorError, paginateItems } from "@/lib/pagination";
import logger from "@/lib/logger";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
  const session = await getServerSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const startedAt = Date.now();
    const body = await request.json();
    const query = SearchQuerySchema.parse(body);

    const registry = createRepositoryRegistry(
      session.accessToken,
      session.tenantId ?? ""
    );
    const inventory = new PolicyInventoryService(registry);
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
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "Invalid search query", details: err.flatten() }, { status: 400 });
    }
    if (err instanceof InvalidCursorError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    logger.error({ err }, "POST /api/search failed");
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

