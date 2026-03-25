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
import logger from "@/lib/logger";

export class DeviceConfigRepository implements PolicyRepository {
  constructor(
    private readonly client: GraphClient,
    private readonly tenantId: string
  ) {}

  async listPolicies(query?: Partial<PolicyListQuery>): Promise<PolicyObject[]> {
    const log = logger.child({ repository: "DeviceConfig", method: "listPolicies" });
    const params = new URLSearchParams({ $top: String(query?.pageSize ?? 100) });
    const path = `${ENDPOINTS.DEVICE_CONFIGS.list}?${params}`;
    const raw = await this.client.getAll<GraphDeviceConfiguration>(path, "v1.0");

    const policies = await Promise.all(
      raw.map(async (p) => {
        try {
          const assignments = await this.client.getAll<GraphAssignment>(
            ENDPOINTS.DEVICE_CONFIGS.assignments(p.id),
            "v1.0"
          );
          return mapDeviceConfiguration(p, this.tenantId, assignments);
        } catch (err) {
          log.warn({ policyId: p.id, err }, "Failed to fetch device config assignments");
          return mapDeviceConfiguration(p, this.tenantId, []);
        }
      })
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
    // Classic device configs expose all settings on the main resource object
    return this.getPolicy(id);
  }

  async getAssignments(policyId: string): Promise<PolicyAssignment[]> {
    const raw = await this.client.getAll<GraphAssignment>(
      ENDPOINTS.DEVICE_CONFIGS.assignments(policyId),
      "v1.0"
    );
    return mapAssignments(raw);
  }
}
