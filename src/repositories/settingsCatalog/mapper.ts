/**
 * Settings Catalog mapper: GraphConfigurationPolicy → PolicyObject
 */

import { Platform, PolicyStatus, PolicyType, SettingDataType, SettingSource, TargetingModel } from "@/domain/enums";
import type { PolicyObject, PolicySetting } from "@/domain/models";
import type {
  GraphConfigurationPolicy,
  GraphConfigurationPolicySetting,
  GraphAssignment,
} from "@/lib/graph/types";
import { mapAssignments } from "../shared/assignmentMapper";

// ============================================================
// Platform mapping
// ============================================================

const PLATFORM_MAP: Record<string, Platform> = {
  windows10: Platform.Windows,
  windows: Platform.Windows,
  macOS: Platform.macOS,
  iOS: Platform.iOS,
  ipad: Platform.iPadOS,
  android: Platform.Android,
  androidEnterprise: Platform.AndroidEnterprise,
  linux: Platform.Linux,
};

function mapPlatform(raw?: string): Platform {
  if (!raw) return Platform.Unknown;
  for (const [key, val] of Object.entries(PLATFORM_MAP)) {
    if (raw.toLowerCase().includes(key.toLowerCase())) return val;
  }
  return Platform.Unknown;
}

// ============================================================
// Policy header mapper
// ============================================================

export function mapConfigurationPolicy(
  raw: GraphConfigurationPolicy,
  tenantId: string,
  assignments: GraphAssignment[] = []
): PolicyObject {
  return {
    id: raw.id,
    tenantId,
    displayName: raw.name,
    description: raw.description,
    policyType: PolicyType.SettingsCatalog,
    platform: mapPlatform(raw.platforms),
    odataType: raw["@odata.type"] ?? "#microsoft.graph.deviceManagementConfigurationPolicy",
    templateId: raw.templateReference?.templateId,
    templateVersion: raw.templateReference?.templateDisplayVersion,
    status: PolicyStatus.Active, // Graph doesn't surface a status for configurationPolicies
    createdDateTime: raw.createdDateTime,
    lastModifiedDateTime: raw.lastModifiedDateTime,
    settingCount: raw.settingCount ?? 0,
    scopeTags: [], // resolved by PolicyInventoryService.enrichWithScopeTags
    roleScopeTagIds: raw.roleScopeTagIds ?? [],
    assignments: mapAssignments(assignments),
    targetingModel: TargetingModel.Unknown, // resolved by service layer after assignments are known
    rawGraphPayload: raw as unknown as Record<string, unknown>,
  };
}

// ============================================================
// Settings mapper
// ============================================================

export function mapConfigurationPolicySettings(
  raw: GraphConfigurationPolicySetting[]
): PolicySetting[] {
  return raw.flatMap((item) => mapSettingInstance(item));
}

function mapSettingInstance(item: GraphConfigurationPolicySetting): PolicySetting[] {
  const inst = item.settingInstance;
  if (!inst) return [];

  const base: PolicySetting = {
    id: inst.settingDefinitionId,
    displayName: prettifySettingId(inst.settingDefinitionId),
    path: buildPathFromId(inst.settingDefinitionId),
    value: null,
    dataType: inferDataType(inst["@odata.type"]),
    source: SettingSource.SettingsCatalog,
    rawValue: inst,
  };

  switch (inst["@odata.type"]) {
    case "#microsoft.graph.deviceManagementConfigurationSimpleSettingInstance":
      return [{ ...base, value: formatSimpleValue(inst.value) }];

    case "#microsoft.graph.deviceManagementConfigurationChoiceSettingInstance":
      if (inst.choiceSettingValue) {
        return [
          {
            ...base,
            value: inst.choiceSettingValue.value,
            dataType: SettingDataType.ChoiceGroup,
            children: inst.choiceSettingValue.children?.flatMap((c) =>
              mapSettingInstance({ id: item.id, settingInstance: c })
            ),
          },
        ];
      }
      return [base];

    case "#microsoft.graph.deviceManagementConfigurationSimpleSettingCollectionInstance":
      return [
        {
          ...base,
          value: (inst.simpleSettingCollectionValue ?? []).map((v) => String(v.value)),
          dataType: SettingDataType.StringList,
        },
      ];

    case "#microsoft.graph.deviceManagementConfigurationGroupSettingCollectionInstance":
      return [
        {
          ...base,
          dataType: SettingDataType.ChoiceGroupCollection,
          value: null,
          children: (inst.groupSettingCollectionValue ?? []).flatMap((group) =>
            (group.children ?? []).flatMap((c) =>
              mapSettingInstance({ id: item.id, settingInstance: c })
            )
          ),
        },
      ];

    default:
      return [{ ...base, value: JSON.stringify(inst) }];
  }
}

// ============================================================
// Helpers
// ============================================================

function formatSimpleValue(value: unknown): string | boolean | number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value;
  return String(value);
}

function inferDataType(odataType: string): SettingDataType {
  if (odataType.includes("Simple") && !odataType.includes("Collection"))
    return SettingDataType.String;
  if (odataType.includes("Choice")) return SettingDataType.ChoiceGroup;
  if (odataType.includes("Collection")) return SettingDataType.StringList;
  return SettingDataType.Unknown;
}

function prettifySettingId(id: string): string {
  // Convert "device_vendor_msft_policy_config_defender_allowrealtimemonitoring"
  // into a human-readable label.
  return id
    .split("_")
    .filter((part) => !["device", "vendor", "msft", "user"].includes(part.toLowerCase()))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildPathFromId(id: string): string {
  const parts = id
    .split("_")
    .filter((part) => !["device", "vendor", "msft", "user"].includes(part.toLowerCase()));
  return parts
    .slice(0, -1)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" > ");
}
