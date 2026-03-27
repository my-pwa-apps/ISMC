/**
 * Repository interface contracts.
 *
 * Every policy type has a corresponding repository implementation that
 * adapts a specific Graph endpoint into the normalized domain model.
 *
 * The interface ensures that the service layer is fully decoupled from
 * any specific Graph response shape or endpoint URL.
 */

import type { PolicyObject, PolicyAssignment, AssignmentFilter, ScopeTag } from "@/domain/models";
import type { PolicyListQuery } from "@/lib/validation/schemas";

// ============================================================
// Policy repository — core CRUD operations
// ============================================================

export interface PolicyRepository {
  /**
   * List all policies of the type this repository handles.
   * Implementations should handle Graph pagination internally.
   */
  listPolicies(query?: Partial<PolicyListQuery>): Promise<PolicyObject[]>;

  /**
   * Get a single policy with full details (including settings).
   * This may require a separate Graph call to the settings/definitions endpoints.
   */
  getPolicy(id: string): Promise<PolicyObject>;

  /**
   * Get full settings list for a policy (lazy-loaded separately).
   * Returns the policy with the `settings` array populated.
   */
  getPolicyWithSettings(id: string): Promise<PolicyObject>;

  /**
   * Get assignments for a policy.
   */
  getAssignments(policyId: string): Promise<PolicyAssignment[]>;

  // ---- Write operations (gated by environment flag) ----

  /**
   * Clone a policy. Returns the new policy object.
   * @throws if write operations are disabled
   */
  clonePolicy?(policyId: string, newName: string): Promise<PolicyObject>;

  /**
   * Update assignments on a policy.
   * @throws if write operations are disabled
   */
  updateAssignments?(policyId: string, assignments: PolicyAssignment[]): Promise<void>;

  /**
   * Restore a new policy from a previously captured snapshot.
   * Implementations should create a new policy instead of mutating the source in place.
   * @throws if write operations are disabled or the policy type is unsupported
   */
  restorePolicyFromSnapshot?(snapshot: PolicyObject, newName: string): Promise<PolicyObject>;
}

// ============================================================
// Assignment filter repository
// ============================================================

export interface AssignmentFilterRepository {
  listFilters(): Promise<AssignmentFilter[]>;
  getFilter(id: string): Promise<AssignmentFilter>;
}

// ============================================================
// Scope tag repository
// ============================================================

export interface ScopeTagRepository {
  listScopeTags(): Promise<ScopeTag[]>;
  getScopeTag(id: string): Promise<ScopeTag>;
}

// ============================================================
// Repository registry — maps PolicyType to its repository
// ============================================================

export interface RepositoryRegistry {
  settingsCatalog: PolicyRepository;
  adminTemplates: PolicyRepository;
  deviceConfig: PolicyRepository;
  endpointSecurity: PolicyRepository;
  securityBaseline: PolicyRepository;
  compliance: PolicyRepository;
  scripts: PolicyRepository;
  remediations: PolicyRepository;
  assignmentFilters: AssignmentFilterRepository;
  scopeTags: ScopeTagRepository;
}
