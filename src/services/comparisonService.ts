/**
 * Policy Comparison Service
 *
 * Compares settings, assignments, and scope between two or more policies.
 */

import type { PolicyObject, PolicyComparisonResult, SettingComparisonEntry } from "@/domain/models";
import { SettingComparisonStatus } from "@/domain/enums";
import { randomUUID } from "crypto";

function generateId(): string {
  return randomUUID();
}

export class ComparisonService {
  /**
   * Compare two or more policies and produce a structured comparison result.
   * Policies must already have their `settings` arrays populated.
   */
  compare(policies: PolicyObject[]): PolicyComparisonResult {
    if (policies.length < 2) {
      throw new Error("At least 2 policies are required for comparison");
    }

    const policyNames: Record<string, string> = {};
    for (const p of policies) {
      policyNames[p.id] = p.displayName;
    }

    // Build a map: settingKey → policy ID → value
    const settingMatrix = new Map<
      string,
      { displayName: string; path?: string; dataType: string; source: string; values: Record<string, unknown> }
    >();

    for (const policy of policies) {
      for (const setting of policy.settings ?? []) {
        const existing = settingMatrix.get(setting.id);
        if (existing) {
          existing.values[policy.id] = setting.value;
        } else {
          settingMatrix.set(setting.id, {
            displayName: setting.displayName,
            path: setting.path,
            dataType: setting.dataType,
            source: setting.source,
            values: { [policy.id]: setting.value },
          });
        }
      }
    }

    const entries: SettingComparisonEntry[] = [];
    const policyIds = policies.map((p) => p.id);

    for (const [settingKey, data] of settingMatrix.entries()) {
      const uniqueValues = new Set(
        policyIds.map((id) => JSON.stringify(data.values[id] ?? undefined))
      );
      const presentPolicies = policyIds.filter((id) => data.values[id] !== undefined);

      let status: SettingComparisonStatus;
      if (presentPolicies.length === 1) {
        // Present in only one policy
        status = policyIds.indexOf(presentPolicies[0]) === 0
          ? SettingComparisonStatus.OnlyInLeft
          : SettingComparisonStatus.OnlyInRight;
      } else if (uniqueValues.size === 1) {
        status = SettingComparisonStatus.Match;
      } else {
        status = SettingComparisonStatus.Conflict;
      }

      entries.push({
        settingKey,
        displayName: data.displayName,
        path: data.path,
        status,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        values: data.values as Record<string, any>,
        dataType: data.dataType as SettingComparisonEntry["dataType"],
        source: data.source as SettingComparisonEntry["source"],
      });
    }

    const summary = {
      totalSettings: entries.length,
      matching: entries.filter((e) => e.status === SettingComparisonStatus.Match).length,
      conflicting: entries.filter((e) => e.status === SettingComparisonStatus.Conflict).length,
      uniqueToLeft: entries.filter((e) => e.status === SettingComparisonStatus.OnlyInLeft).length,
      uniqueToRight: entries.filter((e) => e.status === SettingComparisonStatus.OnlyInRight).length,
      uniquePerPolicy: Object.fromEntries(
        policyIds.map((id) => [
          id,
          entries.filter(
            (e) =>
              e.status !== SettingComparisonStatus.Match &&
              e.status !== SettingComparisonStatus.Conflict &&
              e.values[id] !== undefined
          ).length,
        ])
      ),
    };

    const assignmentDiff = this.compareAssignments(policies);

    return {
      id: generateId(),
      policyIds,
      policyNames,
      entries,
      summary,
      assignmentDiff,
      createdAt: new Date().toISOString(),
    };
  }

  private compareAssignments(policies: PolicyObject[]): PolicyComparisonResult["assignmentDiff"] {
    if (policies.length < 2) {
      return { sharedGroups: [], leftOnly: [], rightOnly: [], scopeTagDiff: { sharedTags: [], leftOnly: [], rightOnly: [] } };
    }

    const [left, right] = policies;

    const leftGroups = new Set(
      left.assignments
        .filter((a) => a.target.groupId)
        .map((a) => a.target.groupId!)
    );
    const rightGroups = new Set(
      right.assignments
        .filter((a) => a.target.groupId)
        .map((a) => a.target.groupId!)
    );

    const leftTags = new Set(left.roleScopeTagIds ?? []);
    const rightTags = new Set(right.roleScopeTagIds ?? []);

    return {
      sharedGroups: [...leftGroups].filter((g) => rightGroups.has(g)),
      leftOnly: [...leftGroups].filter((g) => !rightGroups.has(g)),
      rightOnly: [...rightGroups].filter((g) => !leftGroups.has(g)),
      scopeTagDiff: {
        sharedTags: [...leftTags].filter((t) => rightTags.has(t)),
        leftOnly: [...leftTags].filter((t) => !rightTags.has(t)),
        rightOnly: [...rightTags].filter((t) => !leftTags.has(t)),
      },
    };
  }
}
