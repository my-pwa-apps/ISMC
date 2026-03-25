import { describe, it, expect } from "vitest";
import { getMockRegistry } from "@/repositories/mock";

describe("MockPolicyRepository", () => {
  it("listPolicies returns policies", async () => {
    const repo = getMockRegistry().settingsCatalog;
    const result = await repo.listPolicies();
    expect(result.length).toBeGreaterThan(0);
  });

  it("pagination works correctly", async () => {
    const repo = getMockRegistry().settingsCatalog;
    const page1 = await repo.listPolicies({ page: 1, pageSize: 3 });
    const page2 = await repo.listPolicies({ page: 2, pageSize: 3 });
    expect(page1.length).toBeLessThanOrEqual(3);
    const all = await repo.listPolicies();
    if (all.length > 3) {
      expect(page2.length).toBeGreaterThan(0);
      expect(page1[0]?.id).not.toBe(page2[0]?.id);
    }
  });

  it("getPolicy returns correct policy by id", async () => {
    const repo = getMockRegistry().settingsCatalog;
    const all = await repo.listPolicies();
    const first = all[0]!;
    const found = await repo.getPolicy(first.id);
    expect(found?.id).toBe(first.id);
    expect(found?.displayName).toBe(first.displayName);
  });

  it("getMockRegistry returns a full registry", () => {
    const registry = getMockRegistry();
    expect(registry.settingsCatalog).toBeDefined();
    expect(registry.compliance).toBeDefined();
    expect(registry.assignmentFilters).toBeDefined();
    expect(registry.scopeTags).toBeDefined();
  });
});
