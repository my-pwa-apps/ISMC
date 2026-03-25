/**
 * Assignment Impact Service
 *
 * Derives a human-readable coverage summary from a policy's assignments.
 * Detects overlap with other policies that share assignment groups.
 */

import type { PolicyObject, AssignmentImpact } from "@/domain/models";
import { AssignmentTargetType, OverlapSeverity, TargetingModel } from "@/domain/enums";

export class AssignmentImpactService {
  /**
   * Compute the assignment impact for a single policy,
   * optionally checking for overlap against a list of known policies.
   */
  compute(policy: PolicyObject, allPolicies?: PolicyObject[]): AssignmentImpact {
    const { assignments } = policy;

    const assignedToAllUsers = assignments.some(
      (a) =>
        a.target.type === AssignmentTargetType.AllUsers ||
        a.target.type === AssignmentTargetType.AllLicensedUsers
    );
    const assignedToAllDevices = assignments.some(
      (a) => a.target.type === AssignmentTargetType.AllDevices
    );
    const groupAssignments = assignments.filter(
      (a) => a.target.type === AssignmentTargetType.Group
    );
    const excludedAssignments = assignments.filter(
      (a) => a.target.type === AssignmentTargetType.ExcludeGroup
    );
    const filterCount = assignments.filter((a) => a.target.filter).length;

    const narrative = buildNarrative({
      assignedToAllUsers,
      assignedToAllDevices,
      groupCount: groupAssignments.length,
      excludedGroupCount: excludedAssignments.length,
      filterCount,
    });

    const warnings: string[] = [];
    if (assignedToAllDevices && assignedToAllUsers) {
      warnings.push("Policy is assigned to both All Users and All Devices. Verify this is intentional.");
    }
    if (assignments.length === 0) {
      warnings.push("Policy has no assignments and will not be applied to any targets.");
    }
    if (excludedAssignments.length === 0 && assignedToAllDevices && policy.policyType.includes("Kiosk")) {
      warnings.push("Kiosk policy is assigned to all devices. Consider scoping to a specific group.");
    }

    const overlappingPolicies: AssignmentImpact["overlappingPolicies"] = [];
    if (allPolicies) {
      const myGroups = new Set(groupAssignments.map((a) => a.target.groupId).filter(Boolean) as string[]);
      const myAllDevices = assignedToAllDevices;
      const myAllUsers = assignedToAllUsers;

      for (const other of allPolicies) {
        if (other.id === policy.id) continue;

        const otherGroups = other.assignments
          .filter((a) => a.target.type === AssignmentTargetType.Group)
          .map((a) => a.target.groupId)
          .filter(Boolean) as string[];

        const otherAllDevices = other.assignments.some(
          (a) => a.target.type === AssignmentTargetType.AllDevices
        );
        const otherAllUsers = other.assignments.some(
          (a) => a.target.type === AssignmentTargetType.AllUsers
        );

        const sharedGroups = otherGroups.filter((g) => myGroups.has(g));
        const hasAllOverlap =
          (myAllDevices && otherAllDevices) || (myAllUsers && otherAllUsers);

        if (sharedGroups.length > 0 || hasAllOverlap) {
          const severity = computeOverlapSeverity(
            sharedGroups.length,
            hasAllOverlap,
            policy.policyType === other.policyType
          );
          overlappingPolicies.push({
            policyId: other.id,
            policyName: other.displayName,
            sharedGroups,
            severity,
          });
        }
      }
    }

    return {
      policyId: policy.id,
      policyName: policy.displayName,
      targetingModel: policy.targetingModel ?? TargetingModel.Unknown,
      assignments,
      coverageSummary: {
        assignedToAllUsers,
        assignedToAllDevices,
        groupCount: groupAssignments.length,
        excludedGroupCount: excludedAssignments.length,
        filterCount,
        narrative,
      },
      overlappingPolicies,
      warnings,
    };
  }
}

// ============================================================
// Helpers
// ============================================================

function buildNarrative(opts: {
  assignedToAllUsers: boolean;
  assignedToAllDevices: boolean;
  groupCount: number;
  excludedGroupCount: number;
  filterCount: number;
}): string {
  const parts: string[] = [];

  if (opts.assignedToAllUsers) parts.push("all licensed users");
  if (opts.assignedToAllDevices) parts.push("all enrolled devices");
  if (opts.groupCount > 0) parts.push(`${opts.groupCount} specific group${opts.groupCount > 1 ? "s" : ""}`);

  if (parts.length === 0) return "Not assigned to any target.";

  let narrative = `Assigned to ${parts.join(" and ")}`;

  if (opts.excludedGroupCount > 0) {
    narrative += `, excluding ${opts.excludedGroupCount} group${opts.excludedGroupCount > 1 ? "s" : ""}`;
  }
  if (opts.filterCount > 0) {
    narrative += `, narrowed by ${opts.filterCount} assignment filter${opts.filterCount > 1 ? "s" : ""}`;
  }

  return narrative + ".";
}

function computeOverlapSeverity(
  sharedGroupCount: number,
  hasAllOverlap: boolean,
  sameType: boolean
): OverlapSeverity {
  if (hasAllOverlap && sameType) return OverlapSeverity.Critical;
  if (hasAllOverlap) return OverlapSeverity.High;
  if (sharedGroupCount > 2 && sameType) return OverlapSeverity.High;
  if (sharedGroupCount > 0 && sameType) return OverlapSeverity.Medium;
  if (sharedGroupCount > 0) return OverlapSeverity.Low;
  return OverlapSeverity.None;
}
