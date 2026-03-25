/**
 * Domain Enumerations
 *
 * All enums used by the normalized ISMC domain model.
 * These are independent of any specific Graph API response shape.
 */

// ============================================================
// Policy Classification
// ============================================================

export enum PolicyType {
  // Settings Catalog (configurationPolicies - beta)
  SettingsCatalog = "SettingsCatalog",
  // Administrative Templates (groupPolicyConfigurations - beta)
  AdministrativeTemplate = "AdministrativeTemplate",
  // Classic device configuration profiles (deviceConfigurations - v1.0)
  DeviceConfiguration = "DeviceConfiguration",
  // Endpoint Security policies (intents / templates - beta)
  EndpointSecurity = "EndpointSecurity",
  // Security Baselines (specific intent templates)
  SecurityBaseline = "SecurityBaseline",
  // Compliance policies (deviceCompliancePolicies - v1.0)
  CompliancePolicy = "CompliancePolicy",
  // PowerShell / Shell scripts
  Script = "Script",
  // Proactive Remediations / health scripts
  Remediation = "Remediation",
  // Policy Sets (logical collections)
  PolicySet = "PolicySet",
  // App Protection Policies
  AppProtection = "AppProtection",
  // App Configuration Policies
  AppConfiguration = "AppConfiguration",
  // Update rings / policies
  UpdatePolicy = "UpdatePolicy",
  // Feature updates
  FeatureUpdate = "FeatureUpdate",
  // Quality updates
  QualityUpdate = "QualityUpdate",
  // Driver updates
  DriverUpdate = "DriverUpdate",
  // Windows Autopilot profiles
  AutopilotProfile = "AutopilotProfile",
  // Enrollment restrictions
  EnrollmentRestriction = "EnrollmentRestriction",
  // Unknown / fallback
  Unknown = "Unknown",
}

export enum Platform {
  Windows = "Windows",
  WindowsPhone = "WindowsPhone",
  macOS = "macOS",
  iOS = "iOS",
  iPadOS = "iPadOS",
  Android = "Android",
  AndroidEnterprise = "AndroidEnterprise",
  Linux = "Linux",
  ChromeOS = "ChromeOS",
  CrossPlatform = "CrossPlatform",
  Unknown = "Unknown",
}

export enum PolicyStatus {
  Active = "Active",
  Draft = "Draft",
  Disabled = "Disabled",
  Archived = "Archived",
}

// ============================================================
// Assignment & Targeting
// ============================================================

export enum AssignmentTargetType {
  /** All licensed users */
  AllUsers = "AllUsers",
  /** All enrolled devices */
  AllDevices = "AllDevices",
  /** Specific Entra group */
  Group = "Group",
  /** Entra group excluded from scope */
  ExcludeGroup = "ExcludeGroup",
  /** All licensed users including guests */
  AllLicensedUsers = "AllLicensedUsers",
  Unknown = "Unknown",
}

export enum AssignmentIntent {
  Required = "Required",
  Available = "Available",
  Uninstall = "Uninstall",
  RequiredAndAvailable = "RequiredAndAvailable",
}

export enum FilterMode {
  Include = "Include",
  Exclude = "Exclude",
}

export enum TargetingModel {
  /** Policy will be applied per-device */
  Device = "Device",
  /** Policy will be applied per-user */
  User = "User",
  /** Both device and user context */
  Both = "Both",
  /** Cannot be determined */
  Unknown = "Unknown",
}

// ============================================================
// Settings
// ============================================================

export enum SettingDataType {
  Boolean = "Boolean",
  Integer = "Integer",
  String = "String",
  StringList = "StringList",
  ChoiceGroup = "ChoiceGroup",
  ChoiceGroupCollection = "ChoiceGroupCollection",
  Reference = "Reference",
  Json = "Json",
  Unknown = "Unknown",
}

export enum SettingSource {
  /** Standard Settings Catalog definition */
  SettingsCatalog = "SettingsCatalog",
  /** ADMX-backed definition (either classic or imported) */
  ADMX = "ADMX",
  /** OMA-URI custom setting */
  OmaUri = "OmaUri",
  /** Configuration Service Provider (classic profiles) */
  CSP = "CSP",
  /** Endpoint Security template definition */
  EndpointSecurity = "EndpointSecurity",
  Unknown = "Unknown",
}

// ============================================================
// Comparison
// ============================================================

export enum SettingComparisonStatus {
  /** Same setting with the same value */
  Match = "Match",
  /** Same setting but different values */
  Conflict = "Conflict",
  /** Setting present in left only */
  OnlyInLeft = "OnlyInLeft",
  /** Setting present in right only */
  OnlyInRight = "OnlyInRight",
}

export enum OverlapSeverity {
  None = "None",
  Low = "Low",
  Medium = "Medium",
  High = "High",
  Critical = "Critical",
}

// ============================================================
// Migration
// ============================================================

export enum MigrationReadiness {
  /** Setting is fully supported in Intune */
  Supported = "Supported",
  /** Setting has a partial equivalent */
  PartiallySupported = "PartiallySupported",
  /** No Intune equivalent exists */
  NotSupported = "NotSupported",
  /** Requires a third-party solution or custom OMA-URI */
  WorkaroundAvailable = "WorkaroundAvailable",
  /** Not yet analyzed */
  Unknown = "Unknown",
}

// ============================================================
// Audit
// ============================================================

export enum AuditAction {
  // Read operations (tracked for compliance)
  PolicyViewed = "PolicyViewed",
  PolicyExported = "PolicyExported",
  // Snapshot operations
  SnapshotCreated = "SnapshotCreated",
  SnapshotRestored = "SnapshotRestored",
  // Write operations
  PolicyCloned = "PolicyCloned",
  PolicyCreated = "PolicyCreated",
  PolicyUpdated = "PolicyUpdated",
  PolicyDeleted = "PolicyDeleted",
  AssignmentChanged = "AssignmentChanged",
  // App operations
  SearchSaved = "SearchSaved",
  NoteAdded = "NoteAdded",
  TagApplied = "TagApplied",
  GpoImported = "GpoImported",
}

// ============================================================
// UI / Presentation helpers
// ============================================================

export enum SortDirection {
  Asc = "asc",
  Desc = "desc",
}

export enum ViewMode {
  List = "list",
  Grid = "grid",
  Tree = "tree",
}

export enum ExplorerGroupBy {
  Platform = "Platform",
  PolicyType = "PolicyType",
  AssignmentTarget = "AssignmentTarget",
  ScopeTag = "ScopeTag",
  CreatedBy = "CreatedBy",
  LastModified = "LastModified",
  None = "None",
}
