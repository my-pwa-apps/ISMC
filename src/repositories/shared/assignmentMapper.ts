/**
 * Shared assignment mapper — converts raw Graph assignment responses
 * into normalized PolicyAssignment objects.
 */

import {
  AssignmentIntent,
  AssignmentTargetType,
  FilterMode,
} from "@/domain/enums";
import type { AssignmentFilter, PolicyAssignment } from "@/domain/models";
import type { GraphAssignment } from "@/lib/graph/types";

const TARGET_TYPE_MAP: Record<string, AssignmentTargetType> = {
  "#microsoft.graph.allDevicesAssignmentTarget": AssignmentTargetType.AllDevices,
  "#microsoft.graph.allLicensedUsersAssignmentTarget": AssignmentTargetType.AllLicensedUsers,
  "#microsoft.graph.groupAssignmentTarget": AssignmentTargetType.Group,
  "#microsoft.graph.exclusionGroupAssignmentTarget": AssignmentTargetType.ExcludeGroup,
};

const INTENT_MAP: Record<string, AssignmentIntent> = {
  required: AssignmentIntent.Required,
  available: AssignmentIntent.Available,
  uninstall: AssignmentIntent.Uninstall,
};

export function mapAssignments(raw: GraphAssignment[]): PolicyAssignment[] {
  return raw.map((a) => {
    const targetType =
      TARGET_TYPE_MAP[a.target["@odata.type"]] ?? AssignmentTargetType.Group;

    const filter: AssignmentFilter | undefined =
      a.target.deviceAndAppManagementAssignmentFilterId
        ? {
            id: a.target.deviceAndAppManagementAssignmentFilterId,
            displayName: a.target.deviceAndAppManagementAssignmentFilterId,
            mode:
              a.target.deviceAndAppManagementAssignmentFilterType === "exclude"
                ? FilterMode.Exclude
                : FilterMode.Include,
          }
        : undefined;

    return {
      id: a.id,
      intent: a.intent ? INTENT_MAP[a.intent.toLowerCase()] : undefined,
      source: a.source,
      sourceId: a.sourceId,
      target: {
        type: targetType,
        groupId: a.target.groupId,
        filter,
        deviceAndAppManagementAssignmentFilterId:
          a.target.deviceAndAppManagementAssignmentFilterId,
        deviceAndAppManagementAssignmentFilterType:
          a.target.deviceAndAppManagementAssignmentFilterType === "exclude"
            ? FilterMode.Exclude
            : FilterMode.Include,
      },
    };
  });
}
