/**
 * Device Configuration (classic profiles) mapper.
 * GraphDeviceConfiguration → PolicyObject
 */

import { PolicyStatus, PolicyType, TargetingModel } from "@/domain/enums";
import type { PolicyObject } from "@/domain/models";
import type { GraphDeviceConfiguration, GraphAssignment } from "@/lib/graph/types";
import { mapAssignments } from "../shared/assignmentMapper";
import { mapPlatform } from "../shared/platformMapper";

// ============================================================
// @odata.type friendl display names
// ============================================================

// Profile type display names — used externally
export const PROFILE_TYPE_DISPLAY: Record<string, string> = {
  "#microsoft.graph.windows10EndpointProtectionConfiguration": "Endpoint Protection",
  "#microsoft.graph.windows10GeneralConfiguration": "General Configuration",
  "#microsoft.graph.windowsDomainJoinConfiguration": "Domain Join",
  "#microsoft.graph.iosEasEmailProfileConfiguration": "Email Profile (EAS)",
  "#microsoft.graph.iosGeneralDeviceConfiguration": "General Configuration",
  "#microsoft.graph.macOSTrustedRootCertificate": "Trusted Root Certificate",
  "#microsoft.graph.macOSGeneralDeviceConfiguration": "General Configuration",
  "#microsoft.graph.androidCompliancePolicy": "Compliance Policy",
};

export function getProfileTypeDisplay(odataType: string): string {
  return PROFILE_TYPE_DISPLAY[odataType] ?? odataType.replace("#microsoft.graph.", "").replace(/Configuration$/, "");
}

export function mapDeviceConfiguration(
  raw: GraphDeviceConfiguration,
  tenantId: string,
  assignments: GraphAssignment[] = []
): PolicyObject {
  return {
    id: raw.id,
    tenantId,
    displayName: raw.displayName,
    description: raw.description,
    policyType: PolicyType.DeviceConfiguration,
    platform: mapPlatform(raw["@odata.type"]),
    odataType: raw["@odata.type"],
    status: PolicyStatus.Active,
    createdDateTime: raw.createdDateTime,
    lastModifiedDateTime: raw.lastModifiedDateTime,
    version: String(raw.version ?? ""),
    settingCount: countSettings(raw),
    scopeTags: [], // resolved by PolicyInventoryService.enrichWithScopeTags
    roleScopeTagIds: raw.roleScopeTagIds ?? [],
    assignments: mapAssignments(assignments),
    targetingModel: TargetingModel.Unknown,
    rawGraphPayload: raw as unknown as Record<string, unknown>,
  };
}

/** Rough setting count — count non-standard keys on the raw payload */
function countSettings(raw: Record<string, unknown>): number {
  const skipKeys = new Set([
    "id", "displayName", "description", "createdDateTime",
    "lastModifiedDateTime", "version", "roleScopeTagIds", "@odata.type",
  ]);
  return Object.keys(raw).filter(
    (k) => !skipKeys.has(k) && raw[k] !== null && raw[k] !== undefined
  ).length;
}
