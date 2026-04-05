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
import { PolicyStatus, PolicyType, SettingSource, TargetingModel } from "@/domain/enums";
import { mapAssignments } from "../shared/assignmentMapper";
import { getGraphFetchPageSize } from "../shared/graphFetchPageSize";
import { mapRawPolicySettings } from "../shared/rawPolicySettings";
import { mapPlatform } from "../shared/platformMapper";
import { enrichPoliciesWithAssignments } from "../shared/enrichWithAssignments";

const COMPLIANCE_SETTING_SKIP_KEYS = new Set([
  "id",
  "displayName",
  "description",
  "createdDateTime",
  "lastModifiedDateTime",
  "version",
  "roleScopeTagIds",
  "@odata.type",
  "scheduledActionsForRule",
]);

function mapCompliancePolicy(
  raw: GraphDeviceCompliancePolicy,
  tenantId: string,
  assignments: GraphAssignment[] = []
): PolicyObject {
  const settingCount = Object.keys(raw).filter(
    (k) => !COMPLIANCE_SETTING_SKIP_KEYS.has(k) && raw[k] !== null && raw[k] !== undefined
  ).length;

  return {
    id: raw.id,
    tenantId,
    displayName: raw.displayName,
    description: raw.description,
    policyType: PolicyType.CompliancePolicy,
    platform: mapPlatform(raw["@odata.type"]),
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

  async listPolicies(_query?: Partial<PolicyListQuery>): Promise<PolicyObject[]> {
    const params = new URLSearchParams({ $top: String(getGraphFetchPageSize()) });
    const path = `${ENDPOINTS.COMPLIANCE.list}?${params}`;
    const raw = await this.client.getAll<GraphDeviceCompliancePolicy>(path, "v1.0");

    const policies = await enrichPoliciesWithAssignments(
      this.client,
      raw,
      (p) => ENDPOINTS.COMPLIANCE.assignments(p.id),
      "v1.0",
      (p, assignments) => mapCompliancePolicy(p, this.tenantId, assignments),
      "Compliance"
    );
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
    const [raw, assignments] = await Promise.all([
      this.client.get<GraphDeviceCompliancePolicy>(ENDPOINTS.COMPLIANCE.get(id), "v1.0"),
      this.client.getAll<GraphAssignment>(ENDPOINTS.COMPLIANCE.assignments(id), "v1.0"),
    ]);
    const settings = mapRawPolicySettings(raw, {
      skipKeys: COMPLIANCE_SETTING_SKIP_KEYS,
      source: SettingSource.CSP,
    });

    return {
      ...mapCompliancePolicy(raw, this.tenantId, assignments),
      settingCount: settings.length,
      settings,
    };
  }

  async getAssignments(policyId: string): Promise<PolicyAssignment[]> {
    const raw = await this.client.getAll<GraphAssignment>(
      ENDPOINTS.COMPLIANCE.assignments(policyId),
      "v1.0"
    );
    return mapAssignments(raw);
  }
}
