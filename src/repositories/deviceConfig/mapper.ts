/**
 * Device Configuration (classic profiles) mapper.
 * GraphDeviceConfiguration → PolicyObject
 */

import { Platform, PolicyStatus, PolicyType, TargetingModel } from "@/domain/enums";
import type { PolicyObject } from "@/domain/models";
import type { GraphDeviceConfiguration, GraphAssignment } from "@/lib/graph/types";
import { mapAssignments } from "../shared/assignmentMapper";

// ============================================================
// @odata.type to Platform mapping for classic profiles
// ============================================================

const ODATA_TO_PLATFORM: ReadonlyArray<[string, Platform]> = [
  ["windows10", Platform.Windows],
  ["windowsPhone", Platform.WindowsPhone],
  ["windows", Platform.Windows],
  ["iosEas", Platform.iOS],
  ["ios", Platform.iOS],
  ["iPad", Platform.iPadOS],
  ["macOS", Platform.macOS],
  ["mac", Platform.macOS],
  ["androidWorkProfile", Platform.AndroidEnterprise],
  ["android", Platform.Android],
];

function mapPlatformFromOdataType(odataType: string): Platform {
  const lower = odataType.toLowerCase();
  for (const [fragment, platform] of ODATA_TO_PLATFORM) {
    if (lower.includes(fragment.toLowerCase())) return platform;
  }
  return Platform.Unknown;
}

// ============================================================
// @odata.type friendl display names
// ============================================================

const PROFILE_TYPE_DISPLAY: Record<string, string> = {
  "#microsoft.graph.windows10EndpointProtectionConfiguration": "Endpoint Protection",
  "#microsoft.graph.windows10GeneralConfiguration": "General Configuration",
  "#microsoft.graph.windowsDomainJoinConfiguration": "Domain Join",
  "#microsoft.graph.iosEasEmailProfileConfiguration": "Email Profile (EAS)",
  "#microsoft.graph.iosGeneralDeviceConfiguration": "General Configuration",
  "#microsoft.graph.macOSTrustedRootCertificate": "Trusted Root Certificate",
  "#microsoft.graph.macOSGeneralDeviceConfiguration": "General Configuration",
  "#microsoft.graph.androidCompliancePolicy": "Compliance Policy",
};

function getProfileTypeDisplay(odataType: string): string {
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
    platform: mapPlatformFromOdataType(raw["@odata.type"]),
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
