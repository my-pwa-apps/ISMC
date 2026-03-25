/**
 * Microsoft Graph Response Types
 *
 * Raw DTOs representing Graph API response shapes.
 * These are transformed into normalized domain models by the mapper layer.
 *
 * Graph types from @microsoft/microsoft-graph-types are used where they
 * match the actual API; custom types are defined for beta endpoints that
 * the SDK doesn't fully cover.
 */

// ============================================================
// Graph OData envelope
// ============================================================

export interface GraphODataCollection<T> {
  "@odata.context"?: string;
  "@odata.count"?: number;
  "@odata.nextLink"?: string;
  value: T[];
}

export interface GraphODataDelta<T> extends GraphODataCollection<T> {
  "@odata.deltaLink"?: string;
}

export interface GraphError {
  error: {
    code: string;
    message: string;
    innerError?: {
      date?: string;
      "request-id"?: string;
      "client-request-id"?: string;
    };
  };
}

// ============================================================
// Settings Catalog (beta)
// ============================================================

export interface GraphConfigurationPolicy {
  id: string;
  name: string;
  description?: string;
  platforms?: string; // e.g., "windows10", "macOS", "iOS"
  technologies?: string; // e.g., "mdm", "windows10XManagement"
  createdDateTime: string;
  lastModifiedDateTime: string;
  settingCount: number;
  roleScopeTagIds?: string[];
  isAssigned?: boolean;
  templateReference?: {
    templateId?: string;
    templateFamily?: string;
    templateDisplayName?: string;
    templateDisplayVersion?: string;
  };
  "@odata.type"?: string;
}

export interface GraphConfigurationPolicySetting {
  id: string;
  settingInstance: GraphSettingInstance;
}

export interface GraphSettingInstance {
  "@odata.type": string;
  settingDefinitionId: string;
  settingInstanceTemplateReference?: {
    settingInstanceTemplateId: string;
  };
  // Populated based on @odata.type:
  value?: unknown; // simpleSettingInstance
  valueJson?: string; // simpleSettingCollectionInstance
  children?: GraphSettingInstance[]; // groupSettingCollectionInstance
  groupSettingCollectionValue?: GraphGroupSettingValue[]; // groupSettingCollectionInstance
  choiceSettingValue?: GraphChoiceSettingValue; // choiceSettingInstance
  choiceSettingCollectionValue?: GraphChoiceSettingValue[]; // choiceSettingCollectionInstance
  simpleSettingCollectionValue?: Array<{ "@odata.type": string; value: unknown }>; // simpleSettingCollectionInstance
}

export interface GraphGroupSettingValue {
  settingValueTemplateReference?: unknown;
  children: GraphSettingInstance[];
}

export interface GraphChoiceSettingValue {
  value: string;
  settingValueTemplateReference?: unknown;
  children: GraphSettingInstance[];
}

// ============================================================
// Administrative Templates (beta)
// ============================================================

export interface GraphGroupPolicyConfiguration {
  id: string;
  displayName: string;
  description?: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  roleScopeTagIds?: string[];
  "@odata.type"?: string;
}

export interface GraphGroupPolicyDefinitionValue {
  id: string;
  enabled: boolean;
  configurationType: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  definition?: GraphGroupPolicyDefinition;
  presentationValues?: GraphGroupPolicyPresentationValue[];
}

export interface GraphGroupPolicyDefinition {
  id: string;
  displayName: string;
  explainText?: string;
  categoryPath?: string;
  supportedOn?: string;
  classType?: string; // "machine" | "user"
  policyType?: string;
}

export interface GraphGroupPolicyPresentationValue {
  id: string;
  lastModifiedDateTime: string;
  createdDateTime: string;
  "@odata.type": string;
  value?: unknown;
  presentation?: {
    id: string;
    label?: string;
    "@odata.type": string;
  };
}

// ============================================================
// Device Configuration (v1.0)
// ============================================================

export interface GraphDeviceConfiguration {
  id: string;
  displayName: string;
  description?: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  version: number;
  roleScopeTagIds?: string[];
  "@odata.type": string; // discriminates the subtype
  // Subtype-specific properties are passed through as unknown
  [key: string]: unknown;
}

// ============================================================
// Compliance (v1.0)
// ============================================================

export interface GraphDeviceCompliancePolicy {
  id: string;
  displayName: string;
  description?: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  version: number;
  roleScopeTagIds?: string[];
  "@odata.type": string;
  [key: string]: unknown;
}

// ============================================================
// Endpoint Security / Intents (beta)
// ============================================================

export interface GraphIntent {
  id: string;
  displayName: string;
  description?: string;
  isAssigned?: boolean;
  isMigratingToConfigurationPolicy?: boolean;
  lastModifiedDateTime: string;
  roleScopeTagIds?: string[];
  templateId: string;
  "@odata.type"?: string;
}

export interface GraphIntentSetting {
  id: string;
  definitionId: string;
  valueJson: string;
  "@odata.type": string;
}

export interface GraphTemplate {
  id: string;
  displayName: string;
  description?: string;
  versionInfo?: string;
  isDeprecated?: boolean;
  intentCount?: number;
  platformType?: string;
  templateType?: string;
  templateSubtype?: string;
}

// ============================================================
// Assignment
// ============================================================

export interface GraphAssignment {
  id: string;
  intent?: string;
  source?: string;
  sourceId?: string;
  target: GraphAssignmentTarget;
}

export interface GraphAssignmentTarget {
  "@odata.type": string;
  deviceAndAppManagementAssignmentFilterId?: string;
  deviceAndAppManagementAssignmentFilterType?: string;
  groupId?: string;
}

// ============================================================
// Assignment Filter (beta)
// ============================================================

export interface GraphAssignmentFilter {
  id: string;
  displayName: string;
  description?: string;
  rule: string;
  platform?: string;
  createdDateTime?: string;
  lastModifiedDateTime?: string;
  roleScopeTags?: string[];
}

// ============================================================
// Scope Tag (beta)
// ============================================================

export interface GraphRoleScopeTag {
  id: string;
  displayName: string;
  description?: string;
  isBuiltIn?: boolean;
}

// ============================================================
// Group Policy Analytics / Migration (beta)
// ============================================================

export interface GraphGroupPolicyMigrationReport {
  id: string;
  groupPolicyObjectFile?: {
    id: string;
    content?: string;
    groupPolicyObjectId?: string;
    ouDistinguishedName?: string;
  };
  displayName?: string;
  createdDateTime?: string;
  lastModifiedDateTime?: string;
  groupPolicyObjectId?: string;
  ouDistinguishedName?: string;
  migrationReadiness?: string;
  targetedInActiveDirectory?: boolean;
  totalSettingsCount?: number;
  supportedSettingsCount?: number;
  supportedSettingsPercent?: number;
}

export interface GraphGroupPolicySettingMapping {
  id: string;
  parentId?: string;
  childIdList?: string[];
  settingName?: string;
  settingValue?: string;
  settingScope?: string;
  intuneMappingType?: string;
  intuneSettingDefinitionId?: string;
  intuneSettingUriList?: string[];
  categoryPath?: string;
  admxSettingDefinitionId?: string;
  registryKey?: string;
  registryValueName?: string;
  mdmCspName?: string;
}

// ============================================================
// Graph User / Identity
// ============================================================

export interface GraphUser {
  id: string;
  displayName?: string;
  userPrincipalName?: string;
  mail?: string;
}

export interface GraphGroup {
  id: string;
  displayName?: string;
  description?: string;
  groupTypes?: string[];
  securityEnabled?: boolean;
  mailEnabled?: boolean;
  mail?: string;
}
