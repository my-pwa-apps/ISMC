/**
 * Policy Inventory Service
 *
 * Orchestrates across all repositories to provide a unified view of
 * all policy objects for a tenant, regardless of type.
 */

import type { RepositoryRegistry } from "@/repositories/interfaces";
import type { DashboardStats, PolicyObject, ScopeTag } from "@/domain/models";
import type { PolicyListQuery } from "@/lib/validation/schemas";
import { Platform, PolicyType, TargetingModel, AssignmentTargetType } from "@/domain/enums";
import { isStale, groupBy } from "@/lib/utils";
import { PolicyNotFoundError } from "@/lib/errors";
import { getCachedPolicies, setCachedPolicies } from "@/lib/cache/policyCache";
import logger from "@/lib/logger";

export class PolicyInventoryService {
  constructor(
    private readonly registry: RepositoryRegistry,
    private readonly tenantId?: string
  ) {}

  // ============================================================
  // Listing
  // ============================================================

  /**
   * List all policies across all types. Executes all repository calls
   * in parallel to minimise latency.
   *
   * Results are cached per-tenant for 5 minutes to reduce Graph API load
   * on repeated calls (search, dashboard stats, reports).
   */
  async listAll(query?: Partial<PolicyListQuery>): Promise<PolicyObject[]> {
    const log = logger.child({ service: "PolicyInventory", method: "listAll" });

    // Check cache for unfiltered requests
    const isUnfiltered = !query?.search && !query?.policyType && !query?.platform;
    if (isUnfiltered && this.tenantId) {
      const cached = getCachedPolicies(this.tenantId);
      if (cached) {
        log.debug({ count: cached.length }, "Returning cached policy inventory");
        return cached;
      }
    }

    const [
      settingsCatalog,
      adminTemplates,
      deviceConfig,
      endpointSecurity,
      securityBaselines,
      compliance,
      scripts,
      remediations,
    ] = await Promise.allSettled([
      this.registry.settingsCatalog.listPolicies(query),
      this.registry.adminTemplates.listPolicies(query),
      this.registry.deviceConfig.listPolicies(query),
      this.registry.endpointSecurity.listPolicies(query),
      this.registry.securityBaseline.listPolicies(query),
      this.registry.compliance.listPolicies(query),
      this.registry.scripts.listPolicies(query),
      this.registry.remediations.listPolicies(query),
    ]);

    const policies: PolicyObject[] = [];

    for (const [name, result] of [
      ["settingsCatalog", settingsCatalog],
      ["adminTemplates", adminTemplates],
      ["deviceConfig", deviceConfig],
      ["endpointSecurity", endpointSecurity],
      ["securityBaselines", securityBaselines],
      ["compliance", compliance],
      ["scripts", scripts],
      ["remediations", remediations],
    ] as const) {
      if (result.status === "fulfilled") {
        policies.push(...result.value);
      } else {
        log.error({ source: name, err: result.reason }, "Failed to fetch policies from repository");
      }
    }

    const enriched = await this.enrichWithScopeTags(this.resolveTargetingModels(policies));

    // Cache unfiltered results for subsequent requests
    if (isUnfiltered && this.tenantId) {
      setCachedPolicies(this.tenantId, enriched);
    }

    return enriched;
  }

  /**
   * List policies of a specific type.
   */
  async listByType(type: PolicyType, query?: Partial<PolicyListQuery>): Promise<PolicyObject[]> {
    const repo = this.getRepositoryForType(type);
    if (!repo) return [];
    const policies = await repo.listPolicies(query);
    return this.enrichWithScopeTags(this.resolveTargetingModels(policies));
  }

  /**
   * List policies for a specific platform.
   */
  async listByPlatform(platform: Platform, query?: Partial<PolicyListQuery>): Promise<PolicyObject[]> {
    const all = await this.listAll(query);
    return all.filter((p) => p.platform === platform);
  }

  // ============================================================
  // Single policy
  // ============================================================

  /**
   * Get a single policy with full settings (searches all repositories).
   */
  async getPolicy(id: string, type?: PolicyType): Promise<PolicyObject> {
    if (type) {
      const repo = this.getRepositoryForType(type);
      if (repo) return repo.getPolicyWithSettings(id);
    }

    // Unknown type — try all repositories in order of likelihood
    const repos = [
      this.registry.settingsCatalog,
      this.registry.adminTemplates,
      this.registry.deviceConfig,
      this.registry.endpointSecurity,
      this.registry.securityBaseline,
      this.registry.compliance,
      this.registry.scripts,
    ];

    for (const repo of repos) {
      try {
        return await repo.getPolicyWithSettings(id);
      } catch {
        // Not found in this repo — try the next
      }
    }

    throw new PolicyNotFoundError(id);
  }

  async getPolicySummary(id: string, type?: PolicyType): Promise<PolicyObject> {
    if (type) {
      const repo = this.getRepositoryForType(type);
      if (repo) return repo.getPolicy(id);
    }

    const repos = [
      this.registry.settingsCatalog,
      this.registry.adminTemplates,
      this.registry.deviceConfig,
      this.registry.endpointSecurity,
      this.registry.securityBaseline,
      this.registry.compliance,
      this.registry.scripts,
    ];

    for (const repo of repos) {
      try {
        return await repo.getPolicy(id);
      } catch {
        // Not found in this repo — try the next
      }
    }

    throw new PolicyNotFoundError(id);
  }

  // ============================================================
  // Scope Tags (resolved)
  // ============================================================

  /**
   * Enumerate all scope tags and resolve display names on policies.
   */
  async enrichWithScopeTags(policies: PolicyObject[]): Promise<PolicyObject[]> {
    let scopeTags: ScopeTag[];
    try {
      scopeTags = await this.registry.scopeTags.listScopeTags();
    } catch {
      return policies; // Non-fatal — scope tag names just won't be resolved
    }

    const tagMap = new Map(scopeTags.map((t) => [t.id, t]));

    return policies.map((p) => ({
      ...p,
      scopeTags: (p.roleScopeTagIds ?? []).map(
        (id) => tagMap.get(id) ?? { id, displayName: id }
      ),
    }));
  }

  // ============================================================
  // Dashboard stats
  // ============================================================

  async getDashboardStats(): Promise<DashboardStats> {
    const all = await this.listAll();

    const byType = groupBy(all, (p) => p.policyType);
    const byPlatform = groupBy(all, (p) => p.platform);

    const staleThresholdDays = 90;
    const staleCount = all.filter((p) => isStale(p.lastModifiedDateTime, staleThresholdDays)).length;

    // Recently modified: last 10 policies
    const recentlyModified = [...all]
      .sort((a, b) =>
        new Date(b.lastModifiedDateTime).getTime() - new Date(a.lastModifiedDateTime).getTime()
      )
      .slice(0, 10)
      .map((p) => ({
        policyId: p.id,
        displayName: p.displayName,
        policyType: p.policyType,
        platform: p.platform,
        lastModifiedDateTime: p.lastModifiedDateTime,
      }));

    // Count by type — ensure all types have an entry
    const byTypeCount = Object.fromEntries(
      Object.values(PolicyType).map((t) => [t, (byType[t] ?? []).length])
    ) as Record<PolicyType, number>;

    const byPlatformCount = Object.fromEntries(
      Object.values(Platform).map((p) => [p, (byPlatform[p] ?? []).length])
    ) as Record<Platform, number>;

    return {
      totalPolicies: all.length,
      byType: byTypeCount,
      byPlatform: byPlatformCount,
      unassignedCount: all.filter((p) => p.assignments.length === 0).length,
      missingTagsCount: all.filter((p) => p.scopeTags.length === 0).length,
      conflictCount: all.filter((p) => (p.conflictingPolicyIds?.length ?? 0) > 0).length,
      staleCount,
      recentlyModified,
    };
  }

  // ============================================================
  // Private helpers
  // ============================================================

  private getRepositoryForType(type: PolicyType) {
    switch (type) {
      case PolicyType.SettingsCatalog:
        return this.registry.settingsCatalog;
      case PolicyType.AdministrativeTemplate:
        return this.registry.adminTemplates;
      case PolicyType.DeviceConfiguration:
        return this.registry.deviceConfig;
      case PolicyType.EndpointSecurity:
        return this.registry.endpointSecurity;
      case PolicyType.SecurityBaseline:
        return this.registry.securityBaseline;
      case PolicyType.CompliancePolicy:
        return this.registry.compliance;
      case PolicyType.Script:
        return this.registry.scripts;
      case PolicyType.Remediation:
        return this.registry.remediations;
      default:
        return null;
    }
  }

  private resolveTargetingModels(policies: PolicyObject[]): PolicyObject[] {
    return policies.map((p) => ({
      ...p,
      targetingModel: p.targetingModel !== TargetingModel.Unknown
        ? p.targetingModel
        : inferTargetingModel(p),
    }));
  }
}

function inferTargetingModel(policy: PolicyObject): TargetingModel {
  const hasAllUsers = policy.assignments.some(
    (a) => a.target.type === AssignmentTargetType.AllUsers ||
           a.target.type === AssignmentTargetType.AllLicensedUsers
  );
  const hasAllDevices = policy.assignments.some(
    (a) => a.target.type === AssignmentTargetType.AllDevices
  );
  if (hasAllUsers && hasAllDevices) return TargetingModel.Both;
  if (hasAllUsers) return TargetingModel.User;
  if (hasAllDevices) return TargetingModel.Device;
  if (policy.assignments.length > 0) return TargetingModel.Device; // default for group-based
  return TargetingModel.Unknown;
}
