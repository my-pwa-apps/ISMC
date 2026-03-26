/**
 * Administrative Templates Graph repository.
 *
 * Fetches from: /beta/deviceManagement/groupPolicyConfigurations
 */

import type { PolicyRepository } from "@/repositories/interfaces";
import type { PolicyAssignment, PolicyObject } from "@/domain/models";
import type { PolicyListQuery } from "@/lib/validation/schemas";
import type { GraphClient } from "@/lib/graph/client";
import type {
  GraphGroupPolicyConfiguration,
  GraphGroupPolicyDefinitionValue,
  GraphAssignment,
} from "@/lib/graph/types";
import { ENDPOINTS } from "@/lib/graph/endpoints";
import { mapWithConcurrency } from "@/lib/utils";
import {
  mapGroupPolicyConfiguration,
  mapDefinitionValues,
} from "./mapper";
import { mapAssignments } from "../shared/assignmentMapper";
import { getGraphListConcurrency } from "../shared/graphConcurrency";
import { getGraphFetchPageSize } from "../shared/graphFetchPageSize";
import logger from "@/lib/logger";

export class AdminTemplatesRepository implements PolicyRepository {
  constructor(
    private readonly client: GraphClient,
    private readonly tenantId: string
  ) {}

  async listPolicies(query?: Partial<PolicyListQuery>): Promise<PolicyObject[]> {
    const log = logger.child({ repository: "AdminTemplates", method: "listPolicies" });

    const params = new URLSearchParams({ $top: String(getGraphFetchPageSize()) });
    const path = `${ENDPOINTS.ADMIN_TEMPLATES.list}?${params}`;
    const raw = await this.client.getAll<GraphGroupPolicyConfiguration>(path, "beta");

    const policies = await mapWithConcurrency(raw, getGraphListConcurrency(), async (p) => {
        try {
          const [assignments, defValues] = await Promise.all([
            this.client.getAll<GraphAssignment>(ENDPOINTS.ADMIN_TEMPLATES.assignments(p.id), "beta"),
            // Fetch definition values to get accurate setting count
            this.client.getAll<GraphGroupPolicyDefinitionValue>(
              ENDPOINTS.ADMIN_TEMPLATES.definitionValues(p.id),
              "beta"
            ).catch(() => []),
          ]);
          const policy = mapGroupPolicyConfiguration(p, this.tenantId, assignments);
          return { ...policy, settingCount: defValues.length };
        } catch (err) {
          log.warn({ policyId: p.id, err }, "Failed to enrich admin template");
          return mapGroupPolicyConfiguration(p, this.tenantId, []);
        }
      });

    return policies;
  }

  async getPolicy(id: string): Promise<PolicyObject> {
    const [raw, assignments] = await Promise.all([
      this.client.get<GraphGroupPolicyConfiguration>(ENDPOINTS.ADMIN_TEMPLATES.get(id), "beta"),
      this.client.getAll<GraphAssignment>(ENDPOINTS.ADMIN_TEMPLATES.assignments(id), "beta"),
    ]);
    return mapGroupPolicyConfiguration(raw, this.tenantId, assignments);
  }

  async getPolicyWithSettings(id: string): Promise<PolicyObject> {
    const [policy, definitionValues] = await Promise.all([
      this.getPolicy(id),
      this.client.getAll<GraphGroupPolicyDefinitionValue>(
        ENDPOINTS.ADMIN_TEMPLATES.definitionValues(id),
        "beta"
      ),
    ]);

    return {
      ...policy,
      settingCount: definitionValues.length,
      settings: mapDefinitionValues(definitionValues),
    };
  }

  async getAssignments(policyId: string): Promise<PolicyAssignment[]> {
    const raw = await this.client.getAll<GraphAssignment>(
      ENDPOINTS.ADMIN_TEMPLATES.assignments(policyId),
      "beta"
    );
    return mapAssignments(raw);
  }
}
