import { describe, it, expect, beforeEach } from "vitest";
import { SearchService } from "@/services/searchService";
import { getMockRegistry } from "@/repositories/mock";
import { PolicyInventoryService } from "@/services/policyInventoryService";
import type { PolicyObject } from "@/domain/models";

describe("SearchService", () => {
  let searchService: SearchService;
  let policies: PolicyObject[];

  beforeEach(async () => {
    const registry = getMockRegistry();
    const inventory = new PolicyInventoryService(registry);
    policies = await inventory.listAll();
    searchService = new SearchService();
  });

  it("finds policies by name", () => {
    const results = searchService.search(policies, { text: "BitLocker" });
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.some((r) =>
        r.policyName.toLowerCase().includes("bitlocker")
      )
    ).toBe(true);
  });

  it("returns empty results for garbage query", () => {
    const results = searchService.search(policies, { text: "zzzzzzzzzzzzzzz_no_match_xyz" });
    expect(results.length).toBe(0);
  });

  it("query too short returns empty", () => {
    const results = searchService.search(policies, { text: "a" });
    expect(results.length).toBe(0);
  });
});
