import { describe, it, expect, beforeEach } from "vitest";
import { ComparisonService } from "@/services/comparisonService";
import { getMockRegistry } from "@/repositories/mock";
import { PolicyInventoryService } from "@/services/policyInventoryService";
import { SettingComparisonStatus } from "@/domain/enums";

describe("ComparisonService", () => {
  let comparisonService: ComparisonService;
  let inventoryService: PolicyInventoryService;

  beforeEach(() => {
    const registry = getMockRegistry();
    inventoryService = new PolicyInventoryService(registry);
    comparisonService = new ComparisonService(inventoryService);
  });

  it("comparing a policy to itself returns all matches", async () => {
    const [first] = await inventoryService.listAll();
    if (!first) return;

    const result = await comparisonService.compare([first.id, first.id]);
    expect(result.policies.length).toBe(2);
    const nonMatches = result.settingComparisons.filter(
      (e) => e.status !== SettingComparisonStatus.Match
    );
    expect(nonMatches.length).toBe(0);
  });

  it("throws when fewer than 2 ids provided", async () => {
    const [first] = await inventoryService.listAll();
    await expect(
      comparisonService.compare([first!.id])
    ).rejects.toThrow();
  });
});
