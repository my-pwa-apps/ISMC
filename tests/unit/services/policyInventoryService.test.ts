import { describe, it, expect, beforeEach } from "vitest";
import { PolicyInventoryService } from "@/services/policyInventoryService";
import { getMockRegistry } from "@/repositories/mock";

describe("PolicyInventoryService", () => {
  let service: PolicyInventoryService;

  beforeEach(() => {
    const registry = getMockRegistry();
    service = new PolicyInventoryService(registry);
  });

  it("listAll returns all mock policies", async () => {
    const policies = await service.listAll();
    expect(policies.length).toBeGreaterThan(0);
  });

  it("every policy has required fields", async () => {
    const policies = await service.listAll();
    for (const p of policies) {
      expect(p.id).toBeTruthy();
      expect(p.displayName).toBeTruthy();
      expect(p.policyType).toBeTruthy();
      expect(p.platform).toBeTruthy();
    }
  });

  it("getDashboardStats returns non-null values", async () => {
    const stats = await service.getDashboardStats();
    expect(stats.totalPolicies).toBeGreaterThan(0);
    expect(typeof stats.byType).toBe("object");
    expect(typeof stats.byPlatform).toBe("object");
  });

  it("listByType filters correctly", async () => {
    const all = await service.listAll();
    const type = all[0]?.policyType;
    if (!type) return;
    const filtered = await service.listByType(type);
    expect(filtered.every((p) => p.policyType === type)).toBe(true);
  });
});
