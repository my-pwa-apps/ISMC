"use client";

import { type PolicyComparisonResult, type SettingComparisonEntry } from "@/domain/models";
import { SettingComparisonStatus } from "@/domain/enums";
import { cn } from "@/lib/utils";

interface SettingsMatrixProps {
  result: PolicyComparisonResult;
}

const statusStyles: Record<SettingComparisonStatus, string> = {
  [SettingComparisonStatus.Match]: "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400",
  [SettingComparisonStatus.Conflict]: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400",
  [SettingComparisonStatus.OnlyInLeft]: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
  [SettingComparisonStatus.OnlyInRight]: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
};

const statusLabel: Record<SettingComparisonStatus, string> = {
  [SettingComparisonStatus.Match]: "Match",
  [SettingComparisonStatus.Conflict]: "Conflict",
  [SettingComparisonStatus.OnlyInLeft]: "Only in left",
  [SettingComparisonStatus.OnlyInRight]: "Only in right",
};

function ValueCell({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span className="text-muted-foreground">—</span>;
  if (typeof value === "boolean") return <span>{value ? "Enabled" : "Disabled"}</span>;
  return <span className="font-mono text-xs">{String(value)}</span>;
}

export function SettingsMatrix({ result }: SettingsMatrixProps) {
  const policyIds = result.policyIds;
  const policyNames = result.policyNames;
  const entries = result.entries;

  // Buckets
  const conflicts = entries.filter((e) => e.status === SettingComparisonStatus.Conflict);
  const matches = entries.filter((e) => e.status === SettingComparisonStatus.Match);
  const onlyIn = entries.filter(
    (e) =>
      e.status === SettingComparisonStatus.OnlyInLeft ||
      e.status === SettingComparisonStatus.OnlyInRight
  );

  return (
    <div className="space-y-4">
      {/* Summary chips */}
      <div className="flex gap-3 text-sm">
        {conflicts.length > 0 && (
          <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 font-medium">
            {conflicts.length} conflict{conflicts.length !== 1 ? "s" : ""}
          </span>
        )}
        {matches.length > 0 && (
          <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-medium">
            {matches.length} match{matches.length !== 1 ? "es" : ""}
          </span>
        )}
        {onlyIn.length > 0 && (
          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
            {onlyIn.length} unique
          </span>
        )}
      </div>

      {/* Matrix table */}
      <div className="overflow-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/60">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium text-xs text-muted-foreground w-64">
                Setting
              </th>
              <th className="px-3 py-2.5 text-left font-medium text-xs text-muted-foreground w-24">
                Status
              </th>
              {policyIds.map((id) => (
                <th
                  key={id}
                  className="px-3 py-2.5 text-left font-medium text-xs text-muted-foreground max-w-[180px]"
                  title={policyNames[id]}
                >
                  <span className="truncate block">{policyNames[id] ?? id}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={policyIds.length + 2} className="px-4 py-8 text-center text-muted-foreground text-sm">
                  No settings to compare
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.settingKey} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-2 font-medium text-foreground">
                    <div className="truncate max-w-[240px]" title={entry.displayName}>
                      {entry.displayName}
                    </div>
                    {entry.path && (
                      <div className="text-xs text-muted-foreground font-mono truncate max-w-[240px]">
                        {entry.path}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        statusStyles[entry.status]
                      )}
                    >
                      {statusLabel[entry.status]}
                    </span>
                  </td>
                  {policyIds.map((id) => {
                    const val = entry.values[id];
                    return (
                      <td key={id} className="px-3 py-2 text-sm max-w-[180px] truncate">
                        <ValueCell value={val} />
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
