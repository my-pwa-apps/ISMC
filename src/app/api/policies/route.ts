/**
 * GET /api/policies
 *
 * List all policies (or filter by type/platform/etc.)
 * Supports pagination, search, and filtering.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/serverSession";
import { createRepositoryRegistry } from "@/repositories/factory";
import { PolicyInventoryService } from "@/services/policyInventoryService";
import { PolicyListQuerySchema } from "@/lib/validation/schemas";
import { InvalidCursorError, paginateItems } from "@/lib/pagination";
import { type PolicyObject } from "@/domain/models";
import logger from "@/lib/logger";
import { ZodError } from "zod";

export async function GET(request: NextRequest) {
  const session = await getServerSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const rawQuery = Object.fromEntries(searchParams.entries());
    const query = PolicyListQuerySchema.parse(rawQuery);

    const correlationId = request.headers.get("x-correlation-id") ??
      crypto.randomUUID();

    const registry = createRepositoryRegistry(
      session.accessToken,
      session.tenantId ?? "",
      correlationId
    );
    const service = new PolicyInventoryService(registry);

    const policies = query.policyType
      ? await service.listByType(query.policyType, query)
      : await service.listAll(query);

    const sortedPolicies = sortPolicies(policies, query.sortBy, query.sortDir);
    const page = paginateItems(sortedPolicies, {
      page: query.page,
      pageSize: query.pageSize,
      cursor: query.cursor,
    });

    return NextResponse.json({
      data: page.data,
      meta: page.meta,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "Invalid query", details: err.flatten() }, { status: 400 });
    }
    if (err instanceof InvalidCursorError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    logger.error({ err }, "GET /api/policies failed");
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

function sortPolicies(
  policies: PolicyObject[],
  sortBy?: string,
  sortDir: "asc" | "desc" = "asc"
): PolicyObject[] {
  const direction = sortDir === "asc" ? 1 : -1;
  const sorted = [...policies];

  sorted.sort((left, right) => {
    switch (sortBy) {
      case "displayName":
        return left.displayName.localeCompare(right.displayName) * direction;
      case "createdDateTime":
        return (new Date(left.createdDateTime).getTime() - new Date(right.createdDateTime).getTime()) * direction;
      case "settingCount":
        return (left.settingCount - right.settingCount) * direction;
      case "lastModifiedDateTime":
      default:
        return (new Date(left.lastModifiedDateTime).getTime() - new Date(right.lastModifiedDateTime).getTime()) * direction;
    }
  });

  return sorted;
}

