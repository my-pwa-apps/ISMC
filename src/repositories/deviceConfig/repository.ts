/**
 * Device Configuration Graph repository.
 * Fetches from: /v1.0/deviceManagement/deviceConfigurations
 */

import type { PolicyRepository } from "@/repositories/interfaces";
import type { PolicyAssignment, PolicyObject } from "@/domain/models";
import type { PolicyListQuery } from "@/lib/validation/schemas";
import type { GraphClient } from "@/lib/graph/client";
import type { GraphDeviceConfiguration, GraphAssignment } from "@/lib/graph/types";
import { ENDPOINTS } from "@/lib/graph/endpoints";
import { mapDeviceConfiguration } from "./mapper";
import { mapAssignments } from "../shared/assignmentMapper";
import { enrichPoliciesWithAssignments } from "../shared/enrichWithAssignments";
import { mapRawPolicySettings } from "../shared/rawPolicySettings";
import { getGraphFetchPageSize } from "../shared/graphFetchPageSize";
import { SettingSource } from "@/domain/enums";

const DEVICE_CONFIGURATION_SETTING_SKIP_KEYS = new Set([
  "id",
  "displayName",
  "description",
  "createdDateTime",
  "lastModifiedDateTime",
  "version",
  "roleScopeTagIds",
  "@odata.type",
]);

export class DeviceConfigRepository implements PolicyRepository {
  constructor(
    private readonly client: GraphClient,
    private readonly tenantId: string
  ) {}

  async listPolicies(_query?: Partial<PolicyListQuery>): Promise<PolicyObject[]> {
    const params = new URLSearchParams({ $top: String(getGraphFetchPageSize()) });
    const path = `${ENDPOINTS.DEVICE_CONFIGS.list}?${params}`;
    const raw = await this.client.getAll<GraphDeviceConfiguration>(path, "v1.0");

    const policies = await enrichPoliciesWithAssignments(
      this.client,
      raw,
      (p) => ENDPOINTS.DEVICE_CONFIGS.assignments(p.id),
      "v1.0",
      (p, assignments) => mapDeviceConfiguration(p, this.tenantId, assignments),
      "DeviceConfig"
    );

    return policies;
  }

  async getPolicy(id: string): Promise<PolicyObject> {
    const [raw, assignments] = await Promise.all([
      this.client.get<GraphDeviceConfiguration>(ENDPOINTS.DEVICE_CONFIGS.get(id), "v1.0"),
      this.client.getAll<GraphAssignment>(ENDPOINTS.DEVICE_CONFIGS.assignments(id), "v1.0"),
    ]);
    return mapDeviceConfiguration(raw, this.tenantId, assignments);
  }

  async getPolicyWithSettings(id: string): Promise<PolicyObject> {
    const [raw, assignments] = await Promise.all([
      this.client.get<GraphDeviceConfiguration>(ENDPOINTS.DEVICE_CONFIGS.get(id), "v1.0"),
      this.client.getAll<GraphAssignment>(ENDPOINTS.DEVICE_CONFIGS.assignments(id), "v1.0"),
    ]);
    const settings = mapRawPolicySettings(raw, {
      skipKeys: DEVICE_CONFIGURATION_SETTING_SKIP_KEYS,
      source: SettingSource.CSP,
    });

    return {
      ...mapDeviceConfiguration(raw, this.tenantId, assignments),
      settingCount: settings.length,
      settings,
    };
  }

  async getAssignments(policyId: string): Promise<PolicyAssignment[]> {
    const raw = await this.client.getAll<GraphAssignment>(
      ENDPOINTS.DEVICE_CONFIGS.assignments(policyId),
      "v1.0"
    );
    return mapAssignments(raw);
  }
}
