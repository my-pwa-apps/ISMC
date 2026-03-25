import { describe, it, expect, beforeEach } from "vitest";
import { SearchService } from "@/services/searchService";
import { getMockRegistry } from "@/repositories/mock";
import { PolicyInventoryService } from "@/services/policyInventoryService";

describe("SearchService", () => {
  let searchService: SearchService;

  beforeEach(async () => {
    const registry = getMockRegistry();
    const inventory = new PolicyInventoryService(registry);
    const policies = await inventory.listAll();
    searchService = new SearchService(policies);
  });

  it("finds policies by name", () => {
    const results = searchService.search({ query: "BitLocker" });
    expect(results.results.length).toBeGreaterThan(0);
    expect(
      results.results.some((r) =>
        r.policy.displayName.toLowerCase().includes("bitlocker")
      )
    ).toBe(true);
  });

  it("returns empty results for garbage query", () => {
    const results = searchService.search({ query: "zzzzzzzzzzzzzzz_no_match_xyz" });
    expect(results.results.length).toBe(0);
  });

  it("query too short returns empty", () => {
    const results = searchService.search({ query: "a" });
    expect(results.results.length).toBe(0);
  });
});
