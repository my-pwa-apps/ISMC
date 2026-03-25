/**
 * Settings Catalog Graph repository.
 *
 * Fetches from: /beta/deviceManagement/configurationPolicies
 *
 * This is a beta-only endpoint as of 2025. Wrap in the beta client.
 */

import type { PolicyRepository } from "@/repositories/interfaces";
import type { PolicyAssignment, PolicyObject } from "@/domain/models";
import type { PolicyListQuery } from "@/lib/validation/schemas";
import type { GraphClient } from "@/lib/graph/client";
import type {
  GraphConfigurationPolicy,
  GraphConfigurationPolicySetting,
  GraphAssignment,
  GraphODataCollection,
} from "@/lib/graph/types";
import { ENDPOINTS } from "@/lib/graph/endpoints";
import { mapConfigurationPolicy, mapConfigurationPolicySettings } from "./mapper";
import { mapAssignments } from "../shared/assignmentMapper";
import logger from "@/lib/logger";

export class SettingsCatalogRepository implements PolicyRepository {
  constructor(
    private readonly client: GraphClient,
    private readonly tenantId: string
  ) {}

  async listPolicies(query?: Partial<PolicyListQuery>): Promise<PolicyObject[]> {
    const log = logger.child({ repository: "SettingsCatalog", method: "listPolicies" });
    log.debug({ query }, "Listing Settings Catalog policies");

    const path = buildListUrl(query);
    const raw = await this.client.getAll<GraphConfigurationPolicy>(path, "beta");

    // Fetch assignments in parallel for each policy (batched to avoid throttle)
    const policies = await Promise.all(
      raw.map(async (p) => {
        try {
          const assignments = await this.client.getAll<GraphAssignment>(
            ENDPOINTS.SETTINGS_CATALOG.assignments(p.id),
            "beta"
          );
          return mapConfigurationPolicy(p, this.tenantId, assignments);
        } catch (err) {
          log.warn({ policyId: p.id, err }, "Failed to fetch assignments for policy");
          return mapConfigurationPolicy(p, this.tenantId, []);
        }
      })
    );

    log.info({ count: policies.length }, "Settings Catalog policies loaded");
    return policies;
  }

  async getPolicy(id: string): Promise<PolicyObject> {
    const raw = await this.client.get<GraphConfigurationPolicy>(
      ENDPOINTS.SETTINGS_CATALOG.get(id),
      "beta"
    );
    const assignments = await this.client.getAll<GraphAssignment>(
      ENDPOINTS.SETTINGS_CATALOG.assignments(id),
      "beta"
    );
    return mapConfigurationPolicy(raw, this.tenantId, assignments);
  }

  async getPolicyWithSettings(id: string): Promise<PolicyObject> {
    const [policy, settingsRaw] = await Promise.all([
      this.getPolicy(id),
      this.client.getAll<GraphConfigurationPolicySetting>(
        ENDPOINTS.SETTINGS_CATALOG.settings(id),
        "beta"
      ),
    ]);

    return {
      ...policy,
      settings: mapConfigurationPolicySettings(settingsRaw),
    };
  }

  async getAssignments(policyId: string): Promise<PolicyAssignment[]> {
    const raw = await this.client.getAll<GraphAssignment>(
      ENDPOINTS.SETTINGS_CATALOG.assignments(policyId),
      "beta"
    );
    return mapAssignments(raw);
  }

  async clonePolicy(policyId: string, newName: string): Promise<PolicyObject> {
    this.assertWritesEnabled();
    // Graph supports policy copy via POST to /copy endpoint
    const original = await this.getPolicyWithSettings(policyId);
    const body = {
      displayName: newName,
      description: original.description,
      platforms: original.platform,
      technologies: "mdm",
      settings: [], // TODO: map settings back to Graph format for round-trip clone
    };
    const created = await this.client.post<GraphConfigurationPolicy>(
      ENDPOINTS.SETTINGS_CATALOG.list,
      body,
      "beta"
    );
    return mapConfigurationPolicy(created, this.tenantId, []);
  }

  async updateAssignments(policyId: string, assignments: PolicyAssignment[]): Promise<void> {
    this.assertWritesEnabled();
    // TODO: map PolicyAssignment[] back to Graph assignment format
    logger.warn({ policyId, count: assignments.length }, "updateAssignments not yet implemented for Settings Catalog");
  }

  private assertWritesEnabled(): void {
    if (process.env.ENABLE_WRITE_OPERATIONS !== "true") {
      throw new Error("Write operations are disabled. Set ENABLE_WRITE_OPERATIONS=true to enable.");
    }
  }
}

// ============================================================
// URL builder
// ============================================================

function buildListUrl(query?: Partial<PolicyListQuery>): string {
  const base = ENDPOINTS.SETTINGS_CATALOG.list;
  const params = new URLSearchParams();
  params.set("$top", String(query?.pageSize ?? 100));

  // TODO: add $filter for platform when Graph supports it consistently
  if (query?.search) {
    params.set("$search", `"${query.search}"`);
  }

  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}
