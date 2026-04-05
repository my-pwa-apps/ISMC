import { NextRequest, NextResponse } from "next/server";
import { getServerSession, requireTenantSession } from "@/lib/auth/serverSession";
import { toRouteErrorResponse } from "@/lib/api/routeErrorResponse";
import { createGraphClient } from "@/lib/graph/client";
import { ENDPOINTS } from "@/lib/graph/endpoints";
import { createRepositoryRegistry } from "@/repositories/factory";
import type { AssignmentFilter, PolicyAssignment, PolicyObject } from "@/domain/models";
import type { AssignmentFilterRepository } from "@/repositories/interfaces";
import type { GraphGroup } from "@/lib/graph/types";
import { PolicyInventoryService } from "@/services/policyInventoryService";
import { AuditService } from "@/services/auditService";
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

  const tenantSession = requireTenantSession(session);

  const { id } = await params;

  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid policy ID" }, { status: 400 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const query = QuerySchema.parse(Object.fromEntries(searchParams.entries()));

    const registry = createRepositoryRegistry(
      tenantSession.accessToken,
      tenantSession.tenantId,
      undefined,
      tenantSession.isDemoMode
    );
    const service = new PolicyInventoryService(registry, tenantSession.tenantId);
    const policy = query.withSettings
      ? await service.getPolicy(id, query.policyType)
      : await service.getPolicySummary(id, query.policyType);
    const policyWithResolvedAssignments = await enrichPolicyAssignments(
      policy,
      tenantSession.accessToken,
      registry.assignmentFilters
    );

    try {
      await new AuditService().log({
        tenantId: tenantSession.tenantId,
        actorId: tenantSession.sub,
        action: AuditAction.PolicyViewed,
        entityType: "Policy",
        entityId: id,
        entityName: policyWithResolvedAssignments.displayName,
      });
    } catch (auditErr) {
      logger.error(
        { auditErr, policyId: id, tenantId: tenantSession.tenantId },
        "Failed to record policy view audit entry"
      );
    }

    return NextResponse.json({ data: policyWithResolvedAssignments });
  } catch (err) {
    logger.error({ err, policyId: id }, "GET /api/policies/[id] failed");
    return toRouteErrorResponse(err, "Invalid query");
  }
}

async function enrichPolicyAssignments(
  policy: PolicyObject,
  accessToken: string,
  assignmentFilters: AssignmentFilterRepository
): Promise<PolicyObject> {
  if (!policy.assignments.length) {
    return policy;
  }

  const groupIds = [...new Set(policy.assignments
    .map((assignment) => assignment.target.groupId)
    .filter((groupId): groupId is string => Boolean(groupId)))];
  const filterIds = [...new Set(policy.assignments
    .map((assignment) => assignment.target.filter?.id ?? assignment.target.deviceAndAppManagementAssignmentFilterId)
    .filter((filterId): filterId is string => Boolean(filterId)))];

  const [groupDisplayNames, filtersById] = await Promise.all([
    resolveGroupDisplayNames(accessToken, groupIds),
    resolveAssignmentFilters(assignmentFilters, filterIds),
  ]);

  return {
    ...policy,
    assignments: policy.assignments.map((assignment) =>
      enrichAssignment(assignment, groupDisplayNames, filtersById)
    ),
  };
}

function enrichAssignment(
  assignment: PolicyAssignment,
  groupDisplayNames: Map<string, string>,
  filtersById: Map<string, AssignmentFilter>
): PolicyAssignment {
  const groupId = assignment.target.groupId;
  const filterId = assignment.target.filter?.id ?? assignment.target.deviceAndAppManagementAssignmentFilterId;
  const resolvedFilter = filterId ? filtersById.get(filterId) : undefined;

  return {
    ...assignment,
    target: {
      ...assignment.target,
      groupDisplayName: groupId ? groupDisplayNames.get(groupId) ?? assignment.target.groupDisplayName : assignment.target.groupDisplayName,
      filter: resolvedFilter
        ? {
            ...resolvedFilter,
            mode: assignment.target.filter?.mode ?? resolvedFilter.mode,
          }
        : assignment.target.filter,
    },
  };
}

async function resolveGroupDisplayNames(
  accessToken: string,
  groupIds: string[]
): Promise<Map<string, string>> {
  if (groupIds.length === 0) {
    return new Map();
  }

  const client = createGraphClient(accessToken);
  const responses = await Promise.allSettled(
    groupIds.map(async (groupId) => {
      const group = await client.get<GraphGroup>(
        `${ENDPOINTS.GROUPS.get(groupId)}?$select=id,displayName`,
        "v1.0"
      );

      return [groupId, group.displayName ?? groupId] as const;
    })
  );

  const groups = new Map<string, string>();

  for (const response of responses) {
    if (response.status === "fulfilled") {
      groups.set(response.value[0], response.value[1]);
    }
  }

  return groups;
}

async function resolveAssignmentFilters(
  assignmentFilters: AssignmentFilterRepository,
  filterIds: string[]
): Promise<Map<string, AssignmentFilter>> {
  if (filterIds.length === 0) {
    return new Map();
  }

  try {
    const filters = await assignmentFilters.listFilters();
    return new Map(
      filters
        .filter((filter) => filterIds.includes(filter.id))
        .map((filter) => [filter.id, filter])
    );
  } catch (err) {
    logger.warn({ err, filterIds }, "Failed to resolve assignment filter details");
    return new Map();
  }
}
