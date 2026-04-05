/**
 * Mock repository implementations.
 *
 * These repositories serve mock data for local development.
 * They implement the same PolicyRepository interface as the real
 * Graph-backed repositories, so the service layer is identical.
 *
 * Enabled when NEXT_PUBLIC_ENABLE_MOCK=true.
 */

import type {
  AssignmentFilterRepository,
  PolicyRepository,
  RepositoryRegistry,
  ScopeTagRepository,
} from "@/repositories/interfaces";
import type { AssignmentFilter, PolicyAssignment, PolicyObject, ScopeTag } from "@/domain/models";
import type { PolicyListQuery } from "@/lib/validation/schemas";
import { PolicyType } from "@/domain/enums";
import {
  MOCK_FILTERS,
  MOCK_SCOPE_TAGS,
  MOCK_SETTINGS_CATALOG_POLICIES,
  MOCK_ADMIN_TEMPLATE_POLICIES,
  MOCK_DEVICE_CONFIG_POLICIES,
  MOCK_ENDPOINT_SECURITY_POLICIES,
  MOCK_SECURITY_BASELINE_POLICIES,
  MOCK_COMPLIANCE_POLICIES,
  MOCK_SCRIPTS,
} from "./data";

// ============================================================
// Generic mock policy repository
// ============================================================

class MockPolicyRepository implements PolicyRepository {
  constructor(private readonly policies: PolicyObject[]) {}

  async listPolicies(query?: Partial<PolicyListQuery>): Promise<PolicyObject[]> {
    // Simulate network latency in development
    await simulateDelay(80, 250);

    let results = [...this.policies];

    if (query?.search) {
      const q = query.search.toLowerCase();
      results = results.filter(
        (p) =>
          p.displayName.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    if (query?.platform) {
      results = results.filter((p) => p.platform === query.platform);
    }

    if (query?.scopeTagId) {
      results = results.filter((p) =>
        p.scopeTags.some((t) => t.id === query.scopeTagId)
      );
    }

    if (query?.unassignedOnly) {
      results = results.filter((p) => p.assignments.length === 0);
    }

    if (query?.missingTagsOnly) {
      results = results.filter((p) => p.scopeTags.length === 0);
    }

    // Pagination
    const page = query?.page ?? 1;
    const pageSize = query?.pageSize ?? 50;
    const start = (page - 1) * pageSize;

    return results.slice(start, start + pageSize);
  }

  async getPolicy(id: string): Promise<PolicyObject> {
    await simulateDelay(60, 150);
    const policy = this.policies.find((p) => p.id === id);
    if (!policy) throw new Error(`Mock policy not found: ${id}`);
    return policy;
  }

  async getPolicyWithSettings(id: string): Promise<PolicyObject> {
    const policy = await this.getPolicy(id);
    // Mock data already includes settings for most policies
    return policy;
  }

  async getAssignments(policyId: string): Promise<PolicyAssignment[]> {
    await simulateDelay(40, 100);
    const policy = this.policies.find((p) => p.id === policyId);
    return policy?.assignments ?? [];
  }

  async clonePolicy(policyId: string, newName: string): Promise<PolicyObject> {
    await simulateDelay(300, 800);
    const original = await this.getPolicy(policyId);
    return {
      ...original,
      id: `clone-${Date.now()}`,
      displayName: newName,
      createdDateTime: new Date().toISOString(),
      lastModifiedDateTime: new Date().toISOString(),
      assignments: [],
    };
  }

  async restorePolicyFromSnapshot(snapshot: PolicyObject, newName: string): Promise<PolicyObject> {
    await simulateDelay(300, 800);
    return {
      ...snapshot,
      id: `restore-${Date.now()}`,
      displayName: newName,
      createdDateTime: new Date().toISOString(),
      lastModifiedDateTime: new Date().toISOString(),
      assignments: [],
    };
  }

  async updateAssignments(policyId: string, assignments: PolicyAssignment[]): Promise<void> {
    await simulateDelay(200, 500);
    const policy = this.policies.find((p) => p.id === policyId);
    if (policy) {
      policy.assignments = assignments;
    }
  }
}

// ============================================================
// Mock AssignmentFilter repository
// ============================================================

class MockAssignmentFilterRepository implements AssignmentFilterRepository {
  async listFilters(): Promise<AssignmentFilter[]> {
    await simulateDelay(50, 150);
    return [...MOCK_FILTERS];
  }

  async getFilter(id: string): Promise<AssignmentFilter> {
    await simulateDelay(30, 80);
    const filter = MOCK_FILTERS.find((f) => f.id === id);
    if (!filter) throw new Error(`Mock filter not found: ${id}`);
    return filter;
  }
}

// ============================================================
// Mock ScopeTag repository
// ============================================================

class MockScopeTagRepository implements ScopeTagRepository {
  async listScopeTags(): Promise<ScopeTag[]> {
    await simulateDelay(50, 120);
    return [...MOCK_SCOPE_TAGS];
  }

  async getScopeTag(id: string): Promise<ScopeTag> {
    await simulateDelay(30, 60);
    const tag = MOCK_SCOPE_TAGS.find((t) => t.id === id);
    if (!tag) throw new Error(`Mock scope tag not found: ${id}`);
    return tag;
  }
}

// ============================================================
// Generic fallback (empty) for unsupported types in mock
// ============================================================

class EmptyMockRepository implements PolicyRepository {
  async listPolicies(): Promise<PolicyObject[]> {
    await simulateDelay(50, 100);
    return [];
  }
  async getPolicy(id: string): Promise<PolicyObject> {
    throw new Error(`No mock data for policy: ${id}`);
  }
  async getPolicyWithSettings(id: string): Promise<PolicyObject> {
    return this.getPolicy(id);
  }
  async getAssignments(): Promise<PolicyAssignment[]> {
    return [];
  }
}

// ============================================================
// Registry factory
// ============================================================

let _mockRegistry: RepositoryRegistry | null = null;

export function getMockRegistry(): RepositoryRegistry {
  if (_mockRegistry) return _mockRegistry;

  _mockRegistry = {
    settingsCatalog: new MockPolicyRepository(MOCK_SETTINGS_CATALOG_POLICIES),
    adminTemplates: new MockPolicyRepository(MOCK_ADMIN_TEMPLATE_POLICIES),
    deviceConfig: new MockPolicyRepository(MOCK_DEVICE_CONFIG_POLICIES),
    endpointSecurity: new MockPolicyRepository(MOCK_ENDPOINT_SECURITY_POLICIES),
    securityBaseline: new MockPolicyRepository(MOCK_SECURITY_BASELINE_POLICIES),
    compliance: new MockPolicyRepository(MOCK_COMPLIANCE_POLICIES),
    scripts: new MockPolicyRepository(MOCK_SCRIPTS),
    remediations: new EmptyMockRepository(),
    assignmentFilters: new MockAssignmentFilterRepository(),
    scopeTags: new MockScopeTagRepository(),
  };

  return _mockRegistry;
}

/**
 * Get a single mock repository for a specific policy type.
 */
export function getMockRepositoryForType(type: PolicyType): PolicyRepository {
  const registry = getMockRegistry();
  switch (type) {
    case PolicyType.SettingsCatalog:
      return registry.settingsCatalog;
    case PolicyType.AdministrativeTemplate:
      return registry.adminTemplates;
    case PolicyType.DeviceConfiguration:
      return registry.deviceConfig;
    case PolicyType.EndpointSecurity:
      return registry.endpointSecurity;
    case PolicyType.SecurityBaseline:
      return registry.securityBaseline;
    case PolicyType.CompliancePolicy:
      return registry.compliance;
    case PolicyType.Script:
    case PolicyType.Remediation:
      return registry.scripts;
    default:
      return new EmptyMockRepository();
  }
}

// ============================================================
// Utilities
// ============================================================

function simulateDelay(minMs: number, maxMs: number): Promise<void> {
  if (process.env.NODE_ENV === "test") return Promise.resolve();
  const delay = minMs + Math.random() * (maxMs - minMs);
  return new Promise((r) => setTimeout(r, delay));
}
