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
import { mapWithConcurrency } from "@/lib/utils";
import { mapConfigurationPolicy, mapConfigurationPolicySettings } from "./mapper";
import { mapAssignments } from "../shared/assignmentMapper";
import { getGraphListConcurrency } from "../shared/graphConcurrency";
import { getGraphFetchPageSize } from "../shared/graphFetchPageSize";
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

    const policies = await mapWithConcurrency(raw, getGraphListConcurrency(), async (p) => {
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
      });

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
    const [rawPolicy, assignments, settingsRaw] = await Promise.all([
      this.client.get<GraphConfigurationPolicy>(
        ENDPOINTS.SETTINGS_CATALOG.get(id),
        "beta"
      ),
      this.client.getAll<GraphAssignment>(
        ENDPOINTS.SETTINGS_CATALOG.assignments(id),
        "beta"
      ),
      this.client.getAll<GraphConfigurationPolicySetting>(
        ENDPOINTS.SETTINGS_CATALOG.settings(id),
        "beta"
      ),
    ]);

    const policy = mapConfigurationPolicy(rawPolicy, this.tenantId, assignments);

    return {
      ...policy,
      settings: mapConfigurationPolicySettings(settingsRaw),
      rawGraphPayload: {
        policy: rawPolicy,
        settings: settingsRaw,
      },
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
    const original = await this.getPolicyWithSettings(policyId);
    const body = buildSettingsCatalogCreatePayload(original.rawGraphPayload, newName);
    const created = await this.client.post<GraphConfigurationPolicy>(
      ENDPOINTS.SETTINGS_CATALOG.list,
      body,
      "beta"
    );
    return mapConfigurationPolicy(created, this.tenantId, []);
  }

  async restorePolicyFromSnapshot(snapshot: PolicyObject, newName: string): Promise<PolicyObject> {
    this.assertWritesEnabled();
    const body = buildSettingsCatalogCreatePayload(snapshot.rawGraphPayload, newName);
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
  params.set("$top", String(getGraphFetchPageSize()));

  // TODO: add $filter for platform when Graph supports it consistently
  if (query?.search) {
    params.set("$search", `"${query.search}"`);
  }

  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

interface SettingsCatalogCreateSource {
  policy: GraphConfigurationPolicy;
  settings: GraphConfigurationPolicySetting[];
}

function buildSettingsCatalogCreatePayload(
  rawPayload: PolicyObject["rawGraphPayload"],
  newName: string
) {
  const source = getCreateSource(rawPayload);
  if (!source) {
    throw new Error(
      "This policy does not contain the raw Settings Catalog payload required for clone or restore. Open the policy details again and capture a fresh snapshot."
    );
  }

  return {
    name: newName,
    description: source.policy.description ?? "",
    platforms: source.policy.platforms,
    technologies: source.policy.technologies ?? "mdm",
    roleScopeTagIds: source.policy.roleScopeTagIds ?? [],
    templateReference: source.policy.templateReference,
    settings: source.settings.map((setting) => ({
      settingInstance: setting.settingInstance,
    })),
  };
}

function getCreateSource(
  rawPayload: PolicyObject["rawGraphPayload"]
): SettingsCatalogCreateSource | null {
  if (!isRecord(rawPayload)) {
    return null;
  }

  const policyValue = rawPayload.policy;
  const settingsValue = rawPayload.settings;

  if (!isGraphConfigurationPolicy(policyValue) || !Array.isArray(settingsValue)) {
    return null;
  }

  return {
    policy: policyValue,
    settings: settingsValue as GraphConfigurationPolicySetting[],
  };
}

function isGraphConfigurationPolicy(value: unknown): value is GraphConfigurationPolicy {
  return isRecord(value) && typeof value.id === "string" && typeof value.name === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
