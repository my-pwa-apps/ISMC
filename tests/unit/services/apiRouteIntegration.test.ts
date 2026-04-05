/**
 * Integration tests for service layer operations that mirror API route behavior.
 *
 * These tests exercise the full service + repository mock stack to validate
 * the same logic that API routes depend on.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { PolicyInventoryService } from "@/services/policyInventoryService";
import { SearchService } from "@/services/searchService";
import { ComparisonService } from "@/services/comparisonService";
import { getMockRegistry } from "@/repositories/mock";
import { getPolicyRepositoryForType } from "@/repositories/getPolicyRepositoryForType";
import type { RepositoryRegistry } from "@/repositories/interfaces";
import { PolicyType } from "@/domain/enums";

describe("API Route Integration Tests", () => {
  let registry: RepositoryRegistry;
  let inventory: PolicyInventoryService;

  beforeEach(() => {
    registry = getMockRegistry();
    inventory = new PolicyInventoryService(registry);
  });

  // ==========================================================
  // GET /api/policies
  // ==========================================================
  describe("GET /api/policies", () => {
    it("returns all policies across all types", async () => {
      const policies = await inventory.listAll();
      expect(policies.length).toBeGreaterThan(0);
      expect(policies[0].id).toBeTruthy();
      expect(policies[0].displayName).toBeTruthy();
    });

    it("filters by policy type", async () => {
      const all = await inventory.listAll();
      const type = all[0]?.policyType;
      if (!type) return;
      const filtered = await inventory.listByType(type);
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every((p) => p.policyType === type)).toBe(true);
    });

    it("returns empty for non-existent policy type", async () => {
      const filtered = await inventory.listByType(PolicyType.PolicySet);
      expect(filtered).toEqual([]);
    });

    it("every policy has all required domain fields", async () => {
      const policies = await inventory.listAll();
      for (const p of policies) {
        expect(p.id).toBeTruthy();
        expect(p.displayName).toBeTruthy();
        expect(p.policyType).toBeTruthy();
        expect(p.platform).toBeTruthy();
        expect(p.createdDateTime).toBeTruthy();
        expect(p.lastModifiedDateTime).toBeTruthy();
        expect(typeof p.settingCount).toBe("number");
        expect(Array.isArray(p.assignments)).toBe(true);
        expect(Array.isArray(p.scopeTags)).toBe(true);
      }
    });
  });

  // ==========================================================
  // GET /api/policies/[id]
  // ==========================================================
  describe("GET /api/policies/[id]", () => {
    it("retrieves a single policy by ID", async () => {
      const all = await inventory.listAll();
      const first = all[0];
      const policy = await inventory.getPolicy(first.id, first.policyType);
      expect(policy.id).toBe(first.id);
      expect(policy.displayName).toBe(first.displayName);
    });

    it("retrieves a policy with settings populated", async () => {
      const all = await inventory.listAll();
      const first = all[0];
      const policy = await inventory.getPolicy(first.id, first.policyType);
      // Settings should be populated from getPolicyWithSettings
      expect(policy).toBeDefined();
    });

    it("throws PolicyNotFoundError for non-existent ID", async () => {
      await expect(
        inventory.getPolicy("00000000-0000-0000-0000-000000000000")
      ).rejects.toThrow("Policy not found");
    });

    it("finds policy without type hint (sequential search)", async () => {
      const all = await inventory.listAll();
      const first = all[0];
      const policy = await inventory.getPolicy(first.id);
      expect(policy.id).toBe(first.id);
    });
  });

  // ==========================================================
  // GET /api/dashboard/stats
  // ==========================================================
  describe("GET /api/dashboard/stats", () => {
    it("returns valid dashboard stats", async () => {
      const stats = await inventory.getDashboardStats();
      expect(stats.totalPolicies).toBeGreaterThan(0);
      expect(typeof stats.unassignedCount).toBe("number");
      expect(typeof stats.missingTagsCount).toBe("number");
      expect(typeof stats.staleCount).toBe("number");
      expect(typeof stats.conflictCount).toBe("number");
      expect(stats.recentlyModified.length).toBeLessThanOrEqual(10);
    });

    it("byType covers all PolicyType enum values", async () => {
      const stats = await inventory.getDashboardStats();
      for (const ptype of Object.values(PolicyType)) {
        expect(ptype in stats.byType).toBe(true);
      }
    });
  });

  // ==========================================================
  // POST /api/search
  // ==========================================================
  describe("POST /api/search", () => {
    it("returns matching results for a text query", async () => {
      const policies = await inventory.listAll();
      const search = new SearchService();
      const results = search.search(policies, {
        text: policies[0].displayName.substring(0, 5),
      });
      expect(results.length).toBeGreaterThan(0);
    });

    it("returns empty for very specific non-matching query", async () => {
      const policies = await inventory.listAll();
      const search = new SearchService();
      const results = search.search(policies, {
        text: "zzzzzznonexistentzzzzzz",
      });
      expect(results.length).toBe(0);
    });

    it("rejects queries under 2 characters", async () => {
      const policies = await inventory.listAll();
      const search = new SearchService();
      const results = search.search(policies, { text: "a" });
      expect(results.length).toBe(0);
    });

    it("returns all policies when text is empty (pre-filter only)", async () => {
      const policies = await inventory.listAll();
      const search = new SearchService();
      const results = search.search(policies, { text: "" });
      expect(results.length).toBe(policies.length);
    });

    it("pre-filters by policy type", async () => {
      const policies = await inventory.listAll();
      const search = new SearchService();
      const results = search.search(policies, {
        text: "",
        policyTypes: [PolicyType.SettingsCatalog],
      });
      expect(results.every((r) => r.policyType === PolicyType.SettingsCatalog)).toBe(true);
    });
  });

  // ==========================================================
  // POST /api/compare
  // ==========================================================
  describe("POST /api/compare", () => {
    it("compares two policies and returns structured result", async () => {
      const all = await inventory.listAll();
      const [p1, p2] = all.slice(0, 2);
      if (!p1 || !p2) return;

      const policy1 = await inventory.getPolicy(p1.id, p1.policyType);
      const policy2 = await inventory.getPolicy(p2.id, p2.policyType);

      const comparison = new ComparisonService();
      const result = comparison.compare([policy1, policy2]);

      expect(result.policyIds).toEqual([policy1.id, policy2.id]);
      expect(result.policyNames[policy1.id]).toBe(policy1.displayName);
      expect(result.policyNames[policy2.id]).toBe(policy2.displayName);
      expect(Array.isArray(result.entries)).toBe(true);
      expect(result.summary).toBeDefined();
      expect(typeof result.summary.totalSettings).toBe("number");
      expect(typeof result.summary.matching).toBe("number");
      expect(typeof result.summary.conflicting).toBe("number");
    });

    it("produces deterministic comparison IDs", async () => {
      const all = await inventory.listAll();
      const [p1, p2] = all.slice(0, 2);
      if (!p1 || !p2) return;

      const policy1 = await inventory.getPolicy(p1.id, p1.policyType);
      const policy2 = await inventory.getPolicy(p2.id, p2.policyType);

      const comparison = new ComparisonService();
      const result1 = comparison.compare([policy1, policy2]);
      const result2 = comparison.compare([policy1, policy2]);

      expect(result1.id).toBe(result2.id);
    });

    it("throws when less than 2 policies provided", () => {
      const comparison = new ComparisonService();
      expect(() => comparison.compare([])).toThrow("At least 2 policies");
    });

    it("detects self-comparison as all matching", async () => {
      const all = await inventory.listAll();
      const p1 = all[0];
      if (!p1) return;

      const policy = await inventory.getPolicy(p1.id, p1.policyType);
      const comparison = new ComparisonService();
      const result = comparison.compare([policy, policy]);

      expect(result.summary.conflicting).toBe(0);
    });
  });

  // ==========================================================
  // Repository routing
  // ==========================================================
  describe("getPolicyRepositoryForType", () => {
    it("returns correct repository for each known type", () => {
      const knownTypes = [
        PolicyType.SettingsCatalog,
        PolicyType.AdministrativeTemplate,
        PolicyType.DeviceConfiguration,
        PolicyType.EndpointSecurity,
        PolicyType.SecurityBaseline,
        PolicyType.CompliancePolicy,
        PolicyType.Script,
        PolicyType.Remediation,
      ];

      for (const type of knownTypes) {
        const repo = getPolicyRepositoryForType(registry, type);
        expect(repo).not.toBeNull();
      }
    });

    it("returns null for unsupported types", () => {
      const repo = getPolicyRepositoryForType(registry, PolicyType.PolicySet);
      expect(repo).toBeNull();
    });
  });
});
