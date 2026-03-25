/**
 * Compliance Policy repository.
 * Fetches from: /v1.0/deviceManagement/deviceCompliancePolicies
 */

import type { PolicyRepository } from "@/repositories/interfaces";
import type { PolicyAssignment, PolicyObject } from "@/domain/models";
import type { PolicyListQuery } from "@/lib/validation/schemas";
import type { GraphClient } from "@/lib/graph/client";
import type { GraphDeviceCompliancePolicy, GraphAssignment } from "@/lib/graph/types";
import { ENDPOINTS } from "@/lib/graph/endpoints";
import { mapWithConcurrency } from "@/lib/utils";
import { Platform, PolicyStatus, PolicyType, TargetingModel } from "@/domain/enums";
import { mapAssignments } from "../shared/assignmentMapper";
import { getGraphListConcurrency } from "../shared/graphConcurrency";
import logger from "@/lib/logger";

function mapCompliancePlatform(odataType: string): Platform {
  const t = odataType.toLowerCase();
  if (t.includes("windows")) return Platform.Windows;
  if (t.includes("macos") || t.includes("mac")) return Platform.macOS;
  if (t.includes("ios")) return Platform.iOS;
  if (t.includes("androidworkprofile")) return Platform.AndroidEnterprise;
  if (t.includes("android")) return Platform.Android;
  return Platform.Unknown;
}

function mapCompliancePolicy(
  raw: GraphDeviceCompliancePolicy,
  tenantId: string,
  assignments: GraphAssignment[] = []
): PolicyObject {
  const skipKeys = new Set([
    "id", "displayName", "description", "createdDateTime",
    "lastModifiedDateTime", "version", "roleScopeTagIds", "@odata.type",
    "scheduledActionsForRule",
  ]);
  const settingCount = Object.keys(raw).filter(
    (k) => !skipKeys.has(k) && raw[k] !== null && raw[k] !== undefined
  ).length;

  return {
    id: raw.id,
    tenantId,
    displayName: raw.displayName,
    description: raw.description,
    policyType: PolicyType.CompliancePolicy,
    platform: mapCompliancePlatform(raw["@odata.type"]),
    odataType: raw["@odata.type"],
    status: PolicyStatus.Active,
    createdDateTime: raw.createdDateTime,
    lastModifiedDateTime: raw.lastModifiedDateTime,
    version: String(raw.version ?? ""),
    settingCount,
    scopeTags: [], // resolved by PolicyInventoryService.enrichWithScopeTags
    roleScopeTagIds: raw.roleScopeTagIds ?? [],
    assignments: mapAssignments(assignments),
    targetingModel: TargetingModel.Unknown,
    rawGraphPayload: raw as unknown as Record<string, unknown>,
  };
}

export class ComplianceRepository implements PolicyRepository {
  constructor(
    private readonly client: GraphClient,
    private readonly tenantId: string
  ) {}

  async listPolicies(query?: Partial<PolicyListQuery>): Promise<PolicyObject[]> {
    const log = logger.child({ repository: "Compliance", method: "listPolicies" });
    const params = new URLSearchParams({ $top: String(query?.pageSize ?? 100) });
    const path = `${ENDPOINTS.COMPLIANCE.list}?${params}`;
    const raw = await this.client.getAll<GraphDeviceCompliancePolicy>(path, "v1.0");

    const policies = await mapWithConcurrency(raw, getGraphListConcurrency(), async (p) => {
        try {
          const assignments = await this.client.getAll<GraphAssignment>(
            ENDPOINTS.COMPLIANCE.assignments(p.id),
            "v1.0"
          );
          return mapCompliancePolicy(p, this.tenantId, assignments);
        } catch (err) {
          log.warn({ policyId: p.id, err }, "Failed to fetch compliance policy assignments");
          return mapCompliancePolicy(p, this.tenantId, []);
        }
      });
    return policies;
  }

  async getPolicy(id: string): Promise<PolicyObject> {
    const [raw, assignments] = await Promise.all([
      this.client.get<GraphDeviceCompliancePolicy>(ENDPOINTS.COMPLIANCE.get(id), "v1.0"),
      this.client.getAll<GraphAssignment>(ENDPOINTS.COMPLIANCE.assignments(id), "v1.0"),
    ]);
    return mapCompliancePolicy(raw, this.tenantId, assignments);
  }

  async getPolicyWithSettings(id: string): Promise<PolicyObject> {
    return this.getPolicy(id);
  }

  async getAssignments(policyId: string): Promise<PolicyAssignment[]> {
    const raw = await this.client.getAll<GraphAssignment>(
      ENDPOINTS.COMPLIANCE.assignments(policyId),
      "v1.0"
    );
    return mapAssignments(raw);
  }
}
