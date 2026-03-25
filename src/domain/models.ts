/**
 * ISMC Normalized Domain Models
 *
 * These interfaces represent the canonical internal representation of
 * Intune policy objects, independent of any specific Graph API response
 * shape. Every repository adapter is responsible for transforming raw
 * Graph responses into these models.
 *
 * Design goals:
 *  - Single model to rule all policy types (discriminated by PolicyType)
 *  - All optional Graph-specific fields are clearly annotated
 *  - Strong typing for settings, assignments, and comparison results
 *  - Fully serialisable (no circular refs, no class instances)
 */

import {
  AssignmentIntent,
  AssignmentTargetType,
  AuditAction,
  FilterMode,
  MigrationReadiness,
  OverlapSeverity,
  Platform,
  PolicyStatus,
  PolicyType,
  SettingComparisonStatus,
  SettingDataType,
  SettingSource,
  TargetingModel,
} from "./enums";

// ============================================================
// Primitives / Shared
// ============================================================

export interface Identity {
  id: string;
  displayName: string;
  /** UPN or email if available */
  email?: string;
}

export interface ScopeTag {
  /** Intune scope tag numeric ID */
  id: string;
  displayName: string;
  description?: string;
}

export interface AssignmentFilter {
  /** Intune assignment filter GUID */
  id: string;
  displayName: string;
  description?: string;
  /** OData filter expression */
  rule?: string;
  platform?: Platform;
  mode: FilterMode;
}

// ============================================================
// Policy Assignment
// ============================================================

export interface AssignmentTarget {
  type: AssignmentTargetType;
  /** Present when type === Group or ExcludeGroup */
  groupId?: string;
  groupDisplayName?: string;
  /** Assignment filter applied at targeting time */
  filter?: AssignmentFilter;
  deviceAndAppManagementAssignmentFilterId?: string;
  deviceAndAppManagementAssignmentFilterType?: FilterMode;
}

export interface PolicyAssignment {
  id: string;
  intent?: AssignmentIntent;
  target: AssignmentTarget;
  source?: string;
  sourceId?: string;
}

// ============================================================
// Policy Setting
// ============================================================

export interface PolicySetting {
  /** Stable key — typically the settingDefinitionId or OMA-URI path */
  id: string;
  /** Human-readable display name */
  displayName: string;
  /** Breadcrumb-style path (e.g., "Computer Configuration > Windows > BitLocker") */
  path?: string;
  /** The configured value, serialised to string for display */
  value: string | boolean | number | string[] | Record<string, unknown> | null;
  /** Original raw value from Graph for fidelity */
  rawValue?: unknown;
  dataType: SettingDataType;
  source: SettingSource;
  /** For ADMX settings: the registry key path */
  registryPath?: string;
  /** CSP path (e.g., ./Device/Vendor/MSFT/Policy/Config/...) */
  cspPath?: string;
  /** OMA-URI for custom settings */
  omaUri?: string;
  /** Child / nested settings (e.g., ChoiceGroupCollection children) */
  children?: PolicySetting[];
  /** Whether this is a non-configured / optional setting with no value set */
  isNotConfigured?: boolean;
  /** Description from the settings catalog definition */
  description?: string;
  /** Whether the setting is deprecated */
  isDeprecated?: boolean;
}

// ============================================================
// Core Policy Object
// ============================================================

export interface PolicyObject {
  // ---- Identity ----
  /** Intune-assigned GUID */
  id: string;
  /** Tenant ID this policy belongs to */
  tenantId: string;
  displayName: string;
  description?: string;

  // ---- Classification ----
  policyType: PolicyType;
  platform: Platform;
  /** Graph @odata.type for round-trip fidelity */
  odataType?: string;
  /** Template ID for Security Baselines (references deviceManagement/templates) */
  templateId?: string;
  /** Version of the template / baseline */
  templateVersion?: string;

  // ---- Metadata ----
  status: PolicyStatus;
  createdDateTime: string; // ISO 8601
  lastModifiedDateTime: string; // ISO 8601
  /** User or service principal that created the policy */
  createdBy?: Identity;
  /** Number of settings configured in this policy */
  settingCount: number;
  /** Version string from Graph (if available) */
  version?: string;

  // ---- Scoping ----
  scopeTags: ScopeTag[];
  /** Intune role scope tag IDs */
  roleScopeTagIds?: string[];

  // ---- Assignments ----
  assignments: PolicyAssignment[];
  /** Inferred targeting model based on policy type and assignments */
  targetingModel: TargetingModel;

  // ---- Settings (lazy-loaded in detail view) ----
  /** Populated when the detail endpoints are called */
  settings?: PolicySetting[];

  // ---- Conflict / overlap hints ----
  conflictingPolicyIds?: string[];
  overlapSeverity?: OverlapSeverity;

  // ---- App-level annotations (local DB) ----
  notes?: PolicyNote[];
  tags?: PolicyTag[];
  /** IDs of local snapshots for this policy */
  snapshotIds?: string[];

  // ---- Raw Graph payload (optional, for Raw JSON tab) ----
  rawGraphPayload?: Record<string, unknown>;
}

// ============================================================
// Policy Comparison
// ============================================================

export interface SettingComparisonEntry {
  /** Combined key for matching across policies */
  settingKey: string;
  displayName: string;
  path?: string;
  status: SettingComparisonStatus;
  /** Values keyed by policy ID */
  values: Record<string, string | boolean | number | string[] | null>;
  dataType: SettingDataType;
  source: SettingSource;
}

export interface PolicyComparisonResult {
  id: string; // generated comparison session ID
  policyIds: string[];
  policyNames: Record<string, string>;
  /** All setting entries with their per-policy values */
  entries: SettingComparisonEntry[];
  /** Counts by status */
  summary: {
    totalSettings: number;
    matching: number;
    conflicting: number;
    uniqueToLeft: number;
    uniqueToRight: number;
    uniquePerPolicy: Record<string, number>;
  };
  assignmentDiff: {
    sharedGroups: string[];
    leftOnly: string[];
    rightOnly: string[];
    scopeTagDiff: {
      sharedTags: string[];
      leftOnly: string[];
      rightOnly: string[];
    };
  };
  createdAt: string;
}

// ============================================================
// Assignment Impact
// ============================================================

export interface GroupAssignmentSummary {
  groupId: string;
  groupName: string;
  /** Number of policies assigned to this group */
  policyCount: number;
  /** Policies assigned to this group */
  policyIds: string[];
  isExcluded: boolean;
  filters: AssignmentFilter[];
}

export interface AssignmentImpact {
  policyId: string;
  policyName: string;
  targetingModel: TargetingModel;
  /** Individual assignment entries */
  assignments: PolicyAssignment[];
  /** Derived human-readable coverage summary */
  coverageSummary: {
    assignedToAllUsers: boolean;
    assignedToAllDevices: boolean;
    groupCount: number;
    excludedGroupCount: number;
    filterCount: number;
    /** Estimated coverage narrative */
    narrative: string;
  };
  /** Policies that share at least one assignment group */
  overlappingPolicies: Array<{
    policyId: string;
    policyName: string;
    sharedGroups: string[];
    severity: OverlapSeverity;
  }>;
  /** Risk / warning messages */
  warnings: string[];
}

// ============================================================
// GPO / Migration
// ============================================================

export interface GpoSetting {
  id: string;
  /** Registry key or policy category path */
  path: string;
  name: string;
  value: string | null;
  state: "Enabled" | "Disabled" | "NotConfigured";
  /** Scope: computer or user */
  scope: "Computer" | "User";
  registryKey?: string;
  registryValueName?: string;
}

export interface MigrationMapping {
  gpoSetting: GpoSetting;
  readiness: MigrationReadiness;
  /** Matching Intune Settings Catalog definition ID if supported */
  intuneSettingId?: string;
  /** Human-readable Intune path (e.g., "Settings Catalog > BitLocker > ...") */
  intunePath?: string;
  /** Additional guidance text */
  guidance?: string;
  /** Whether an ADMX import is required */
  requiresAdmxImport?: boolean;
}

export interface MigrationAssessment {
  id: string;
  importName: string;
  gpoName?: string;
  settings: MigrationMapping[];
  summary: {
    total: number;
    supported: number;
    partiallySupported: number;
    notSupported: number;
    workararoundAvailable: number;
    readinessScore: number; // 0–100
  };
  createdAt: string;
}

// ============================================================
// Snapshot
// ============================================================

export interface PolicySnapshot {
  id: string;
  policyId: string;
  policyType: PolicyType;
  displayName: string;
  tenantId: string;
  snapshotData: PolicyObject;
  note?: string;
  createdAt: string;
  createdById?: string;
  createdByName?: string;
}

// ============================================================
// Local annotations
// ============================================================

export interface PolicyNote {
  id: string;
  policyId: string;
  content: string;
  authorName?: string;
  isResolved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PolicyTag {
  id: string;
  policyId: string;
  key: string;
  value: string;
}

// ============================================================
// Search
// ============================================================

export interface SearchQuery {
  text: string;
  /** Policy types to include (empty = all) */
  policyTypes?: PolicyType[];
  platforms?: Platform[];
  policyStatuses?: PolicyStatus[];
  scopeTagIds?: string[];
  groupIds?: string[];
  /** Date range */
  modifiedAfter?: string;
  modifiedBefore?: string;
  /** Include settings in search scope */
  searchSettings?: boolean;
  /** Include assignments in search scope */
  searchAssignments?: boolean;
}

export interface SearchResult {
  policyId: string;
  policyName: string;
  policyType: PolicyType;
  platform: Platform;
  /** Highlighted excerpt showing why this result matched */
  highlights: SearchHighlight[];
  relevanceScore: number;
}

export interface SearchHighlight {
  field: string;
  excerpt: string;
  /** Character ranges to highlight in the excerpt */
  ranges: Array<{ start: number; end: number }>;
}

// ============================================================
// Reports
// ============================================================

export type ReportType =
  | "unassigned-policies"
  | "duplicate-policies"
  | "conflicting-settings"
  | "missing-scope-tags"
  | "stale-policies"
  | "overlapping-assignments"
  | "migration-readiness"
  | "settings-usage";

export interface ReportRow {
  [key: string]: string | number | boolean | null | undefined;
}

export interface PolicyReport {
  type: ReportType;
  generatedAt: string;
  tenantId: string;
  rowCount: number;
  columns: Array<{ key: string; label: string; type: "string" | "number" | "boolean" | "date" }>;
  rows: ReportRow[];
  summary?: Record<string, string | number>;
}

// ============================================================
// Dashboard KPIs
// ============================================================

export interface DashboardStats {
  totalPolicies: number;
  byType: Record<PolicyType, number>;
  byPlatform: Record<Platform, number>;
  unassignedCount: number;
  missingTagsCount: number;
  conflictCount: number;
  staleCount: number; // not modified in > 90 days
  gpoMigrationReadiness?: number; // 0–100 score if migration data exists
  recentlyModified: Array<{
    policyId: string;
    displayName: string;
    policyType: PolicyType;
    platform: Platform;
    lastModifiedDateTime: string;
  }>;
}

// ============================================================
// Audit
// ============================================================

export interface AuditRecord {
  id: string;
  tenantId: string;
  actorId?: string;
  actorName?: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  entityName?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

// ============================================================
// Permission Diagnostics
// ============================================================

export interface PermissionDiagnostic {
  scope: string;
  granted: boolean;
  required: boolean;
  description: string;
}

export interface TenantDiagnostics {
  tenantId: string;
  tenantName?: string;
  currentUser: Identity;
  graphPermissions: PermissionDiagnostic[];
  betaEndpointsAvailable: boolean;
  writeOperationsEnabled: boolean;
  environment: string;
  appVersion: string;
  checkedAt: string;
}
