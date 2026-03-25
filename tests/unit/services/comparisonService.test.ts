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
    comparisonService = new ComparisonService();
  });

  it("comparing a policy to itself returns all matches", async () => {
    const [first] = await inventoryService.listAll();
    if (!first) return;

    // compare() takes PolicyObject[] — pass the full object, not just the ID
    const result = comparisonService.compare([first, first]);
    expect(result.policyIds.length).toBe(2);
    const nonMatches = result.entries.filter(
      (e) => e.status !== SettingComparisonStatus.Match
    );
    expect(nonMatches.length).toBe(0);
  });

  it("throws when fewer than 2 policies provided", () => {
    expect(() => comparisonService.compare([])).toThrow();
  });
});
