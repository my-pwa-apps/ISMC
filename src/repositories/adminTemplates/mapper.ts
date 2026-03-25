/**
 * Administrative Templates mapper:
 * GraphGroupPolicyConfiguration → PolicyObject
 */

import { Platform, PolicyStatus, PolicyType, SettingDataType, SettingSource, TargetingModel } from "@/domain/enums";
import type { PolicyObject, PolicySetting } from "@/domain/models";
import type {
  GraphGroupPolicyConfiguration,
  GraphGroupPolicyDefinitionValue,
  GraphAssignment,
} from "@/lib/graph/types";
import { mapAssignments } from "../shared/assignmentMapper";

export function mapGroupPolicyConfiguration(
  raw: GraphGroupPolicyConfiguration,
  tenantId: string,
  assignments: GraphAssignment[] = []
): PolicyObject {
  return {
    id: raw.id,
    tenantId,
    displayName: raw.displayName,
    description: raw.description,
    policyType: PolicyType.AdministrativeTemplate,
    platform: Platform.Windows, // Admin Templates are Windows-only
    odataType: raw["@odata.type"] ?? "#microsoft.graph.groupPolicyConfiguration",
    status: PolicyStatus.Active,
    createdDateTime: raw.createdDateTime,
    lastModifiedDateTime: raw.lastModifiedDateTime,
    settingCount: 0, // populated after fetching definition values
    scopeTags: [], // resolved by PolicyInventoryService.enrichWithScopeTags
    roleScopeTagIds: raw.roleScopeTagIds ?? [],
    assignments: mapAssignments(assignments),
    targetingModel: TargetingModel.Unknown,
    rawGraphPayload: raw as unknown as Record<string, unknown>,
  };
}

export function mapDefinitionValues(
  values: GraphGroupPolicyDefinitionValue[]
): PolicySetting[] {
  return values.map((v) => {
    const def = v.definition;
    const path =
      def?.categoryPath
        ? def.categoryPath
            .split("\\")
            .map((p) => p.trim())
            .join(" > ")
        : undefined;

    const setting: PolicySetting = {
      id: v.id,
      displayName: def?.displayName ?? v.id,
      path,
      value: v.enabled ? "Enabled" : "Disabled",
      dataType: SettingDataType.ChoiceGroup,
      source: SettingSource.ADMX,
      description: def?.explainText,
    };

    // Map presentation values to child settings
    if (v.presentationValues && v.presentationValues.length > 0) {
      setting.children = v.presentationValues.map((pv) => ({
        id: pv.id,
        displayName: pv.presentation?.label ?? pv.id,
        path,
        value: formatPresentationValue(pv),
        dataType: inferPresentationDataType(pv["@odata.type"]),
        source: SettingSource.ADMX,
        rawValue: pv,
      }));
    }

    return setting;
  });
}

function formatPresentationValue(pv: { "@odata.type": string; value?: unknown }): string | boolean | number | null {
  if (pv.value === null || pv.value === undefined) return null;
  if (typeof pv.value === "boolean") return pv.value;
  if (typeof pv.value === "number") return pv.value;
  if (Array.isArray(pv.value)) return (pv.value as unknown[]).join(", ");
  return String(pv.value);
}

function inferPresentationDataType(odataType: string): SettingDataType {
  if (odataType.includes("Boolean")) return SettingDataType.Boolean;
  if (odataType.includes("Decimal") || odataType.includes("Long")) return SettingDataType.Integer;
  if (odataType.includes("MultiText") || odataType.includes("List")) return SettingDataType.StringList;
  return SettingDataType.String;
}
