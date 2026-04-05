/**
 * Endpoint Security / Security Baseline repository.
 * Fetches from: /beta/deviceManagement/intents
 *
 * Both Endpoint Security and Security Baselines use the same
 * `intents` endpoint — differentiated by their `templateId`.
 */

import type { PolicyRepository } from "@/repositories/interfaces";
import type { PolicyAssignment, PolicyObject } from "@/domain/models";
import type { PolicyListQuery } from "@/lib/validation/schemas";
import type { GraphClient } from "@/lib/graph/client";
import type { GraphIntent, GraphIntentSetting, GraphAssignment } from "@/lib/graph/types";
import { ENDPOINTS } from "@/lib/graph/endpoints";
import { mapWithConcurrency } from "@/lib/utils";
import { Platform, PolicyStatus, PolicyType, SettingDataType, SettingSource, TargetingModel } from "@/domain/enums";
import type { PolicySetting } from "@/domain/models";
import { mapAssignments } from "../shared/assignmentMapper";
import { getGraphListConcurrency } from "../shared/graphConcurrency";
import { getGraphFetchPageSize } from "../shared/graphFetchPageSize";
import logger from "@/lib/logger";

// ============================================================
// Well-known Security Baseline template IDs
// These are stable template IDs from Microsoft's baseline catalogue.
// ============================================================
const SECURITY_BASELINE_TEMPLATE_IDS = new Set([
  "034ccd46-190c-4afc-adf1-ad7cc674f145", // Windows Security Baseline
  "a8d6df28-abff-432e-855c-b66f75c5b9d6", // Edge Security Baseline
  "90293062-a8b0-4ae7-b409-91de96b7ea5b", // Defender for Endpoint Baseline
  "cef15778-c3b9-4d53-a00a-042929f0aad0", // Windows 365 Security Baseline
]);

function isSecurityBaseline(templateId: string): boolean {
  return SECURITY_BASELINE_TEMPLATE_IDS.has(templateId);
}

function mapIntentPolicy(
  raw: GraphIntent,
  tenantId: string,
  assignments: GraphAssignment[]
): PolicyObject {
  return {
    id: raw.id,
    tenantId,
    displayName: raw.displayName,
    description: raw.description,
    policyType: isSecurityBaseline(raw.templateId)
      ? PolicyType.SecurityBaseline
      : PolicyType.EndpointSecurity,
    platform: Platform.Windows, // Intents are currently Windows-only
    odataType: raw["@odata.type"] ?? "#microsoft.graph.deviceManagementIntent",
    templateId: raw.templateId,
    status: PolicyStatus.Active,
    createdDateTime: raw.lastModifiedDateTime, // intents don't expose createdDateTime
    lastModifiedDateTime: raw.lastModifiedDateTime,
    settingCount: 0, // populated after fetching settings
    scopeTags: [], // resolved by PolicyInventoryService.enrichWithScopeTags
    roleScopeTagIds: raw.roleScopeTagIds ?? [],
    assignments: mapAssignments(assignments),
    targetingModel: TargetingModel.Device,
    rawGraphPayload: raw as unknown as Record<string, unknown>,
  };
}

function mapIntentSettings(raw: GraphIntentSetting[]): PolicySetting[] {
  return raw.map((s) => {
    let value: unknown = null;
    try {
      value = JSON.parse(s.valueJson);
    } catch {
      value = s.valueJson;
    }
    return {
      id: s.definitionId,
      displayName: prettifyDefinitionId(s.definitionId),
      value: value as string | boolean | number | null,
      dataType: SettingDataType.Unknown,
      source: SettingSource.EndpointSecurity,
      rawValue: s,
    };
  });
}

function prettifyDefinitionId(id: string): string {
  return id
    .split("_")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export class EndpointSecurityRepository implements PolicyRepository {
  constructor(
    private readonly client: GraphClient,
    private readonly tenantId: string,
    private readonly typeFilter?: "security-baseline" | "endpoint-security"
  ) {}

  async listPolicies(_query?: Partial<PolicyListQuery>): Promise<PolicyObject[]> {
    const log = logger.child({ repository: "EndpointSecurity", method: "listPolicies" });
    const params = new URLSearchParams({ $top: String(getGraphFetchPageSize()) });
    const path = `${ENDPOINTS.ENDPOINT_SECURITY.list}?${params}`;
    const raw = await this.client.getAll<GraphIntent>(path, "beta");

    // Filter by baseline vs non-baseline depending on which repo this is
    const filtered = raw.filter((r) => {
      const isSB = isSecurityBaseline(r.templateId);
      if (this.typeFilter === "security-baseline") return isSB;
      if (this.typeFilter === "endpoint-security") return !isSB;
      return true;
    });

    const policies = await mapWithConcurrency(filtered, getGraphListConcurrency(), async (p) => {
        try {
          const [assignments, settings] = await Promise.all([
            this.client.getAll<GraphAssignment>(ENDPOINTS.ENDPOINT_SECURITY.assignments(p.id), "beta"),
            this.client.getAll<GraphIntentSetting>(ENDPOINTS.ENDPOINT_SECURITY.settings(p.id), "beta")
              .catch((err) => {
                logger.warn({ policyId: p.id, err }, "Failed to fetch endpoint security settings");
                return [];
              }),
          ]);
          const policy = mapIntentPolicy(p, this.tenantId, assignments);
          return { ...policy, settingCount: settings.length };
        } catch (err) {
          log.warn({ policyId: p.id, err }, "Failed to enrich endpoint security policy");
          return mapIntentPolicy(p, this.tenantId, []);
        }
      });

    return policies;
  }

  async getPolicy(id: string): Promise<PolicyObject> {
    const [raw, assignments] = await Promise.all([
      this.client.get<GraphIntent>(ENDPOINTS.ENDPOINT_SECURITY.get(id), "beta"),
      this.client.getAll<GraphAssignment>(ENDPOINTS.ENDPOINT_SECURITY.assignments(id), "beta"),
    ]);
    return mapIntentPolicy(raw, this.tenantId, assignments);
  }

  async getPolicyWithSettings(id: string): Promise<PolicyObject> {
    const [policy, settings] = await Promise.all([
      this.getPolicy(id),
      this.client.getAll<GraphIntentSetting>(ENDPOINTS.ENDPOINT_SECURITY.settings(id), "beta"),
    ]);
    return { ...policy, settingCount: settings.length, settings: mapIntentSettings(settings) };
  }

  async getAssignments(policyId: string): Promise<PolicyAssignment[]> {
    const raw = await this.client.getAll<GraphAssignment>(
      ENDPOINTS.ENDPOINT_SECURITY.assignments(policyId),
      "beta"
    );
    return mapAssignments(raw);
  }
}
