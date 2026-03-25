import { describe, it, expect } from "vitest";
import { MockPolicyRepository, getMockRegistry } from "@/repositories/mock";
import { PolicyType } from "@/domain/enums";

describe("MockPolicyRepository", () => {
  it("listPolicies returns policies", async () => {
    const repo = new MockPolicyRepository();
    const result = await repo.listPolicies();
    expect(result.data.length).toBeGreaterThan(0);
    expect(typeof result.total).toBe("number");
  });

  it("pagination works correctly", async () => {
    const repo = new MockPolicyRepository();
    const page1 = await repo.listPolicies({ page: 1, pageSize: 3 });
    const page2 = await repo.listPolicies({ page: 2, pageSize: 3 });
    expect(page1.data.length).toBeLessThanOrEqual(3);
    if (page1.total > 3) {
      expect(page2.data.length).toBeGreaterThan(0);
      expect(page1.data[0].id).not.toBe(page2.data[0]?.id);
    }
  });

  it("getPolicy returns correct policy by id", async () => {
    const repo = new MockPolicyRepository();
    const all = await repo.listPolicies();
    const first = all.data[0]!;
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
