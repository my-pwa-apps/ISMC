import { describe, it, expect, beforeEach } from "vitest";
import {
  getCachedPolicies,
  setCachedPolicies,
  invalidatePolicyCache,
  clearPolicyCache,
} from "@/lib/cache/policyCache";
import type { PolicyObject } from "@/domain/models";
import { Platform, PolicyStatus, PolicyType, TargetingModel } from "@/domain/enums";

const makeMockPolicy = (id: string): PolicyObject => ({
  id,
  tenantId: "test-tenant",
  displayName: `Policy ${id}`,
  policyType: PolicyType.SettingsCatalog,
  platform: Platform.Windows,
  status: PolicyStatus.Active,
  createdDateTime: new Date().toISOString(),
  lastModifiedDateTime: new Date().toISOString(),
  settingCount: 0,
  scopeTags: [],
  assignments: [],
  targetingModel: TargetingModel.Unknown,
});

describe("policyCache", () => {
  beforeEach(() => {
    clearPolicyCache();
  });

  it("returns undefined for empty cache", () => {
    expect(getCachedPolicies("tenant-1")).toBeUndefined();
  });

  it("stores and retrieves cached policies", () => {
    const policies = [makeMockPolicy("1"), makeMockPolicy("2")];
    setCachedPolicies("tenant-1", policies);
    const cached = getCachedPolicies("tenant-1");
    expect(cached).toEqual(policies);
  });

  it("isolates caches by tenant", () => {
    setCachedPolicies("tenant-1", [makeMockPolicy("1")]);
    setCachedPolicies("tenant-2", [makeMockPolicy("2")]);
    expect(getCachedPolicies("tenant-1")?.length).toBe(1);
    expect(getCachedPolicies("tenant-2")?.length).toBe(1);
    expect(getCachedPolicies("tenant-1")?.[0].id).toBe("1");
    expect(getCachedPolicies("tenant-2")?.[0].id).toBe("2");
  });

  it("invalidates cache for a specific tenant", () => {
    setCachedPolicies("tenant-1", [makeMockPolicy("1")]);
    setCachedPolicies("tenant-2", [makeMockPolicy("2")]);
    invalidatePolicyCache("tenant-1");
    expect(getCachedPolicies("tenant-1")).toBeUndefined();
    expect(getCachedPolicies("tenant-2")).toBeDefined();
  });

  it("clears all caches", () => {
    setCachedPolicies("tenant-1", [makeMockPolicy("1")]);
    setCachedPolicies("tenant-2", [makeMockPolicy("2")]);
    clearPolicyCache();
    expect(getCachedPolicies("tenant-1")).toBeUndefined();
    expect(getCachedPolicies("tenant-2")).toBeUndefined();
  });
});
