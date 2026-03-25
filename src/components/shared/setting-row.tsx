import { type PolicySetting } from "@/domain/models";
import { SettingComparisonStatus } from "@/domain/enums";
import { cn } from "@/lib/utils";
import { ChevronRightIcon, ChevronDownIcon } from "lucide-react";
import { useState } from "react";

interface SettingRowProps {
  setting: PolicySetting;
  depth?: number;
  comparisonStatus?: SettingComparisonStatus;
  showPath?: boolean;
}

const statusStyles: Partial<Record<SettingComparisonStatus, string>> = {
  [SettingComparisonStatus.Match]: "bg-green-50 dark:bg-green-950/20",
  [SettingComparisonStatus.Conflict]: "bg-red-50 dark:bg-red-950/20 border-l-2 border-l-red-500",
  [SettingComparisonStatus.OnlyInLeft]: "bg-blue-50 dark:bg-blue-950/20 border-l-2 border-l-blue-500",
  [SettingComparisonStatus.OnlyInRight]: "bg-yellow-50 dark:bg-yellow-950/20 border-l-2 border-l-yellow-500",
};

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "Enabled" : "Disabled";
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
}

export function SettingRow({
  setting,
  depth = 0,
  comparisonStatus,
  showPath,
}: SettingRowProps) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = (setting.children?.length ?? 0) > 0;

  return (
    <>
      <div
        className={cn(
          "flex items-start gap-2 px-4 py-2 text-sm hover:bg-muted/40 transition-colors",
          depth > 0 && "border-l border-border ml-4",
          comparisonStatus && statusStyles[comparisonStatus]
        )}
        style={{ paddingLeft: `${(depth + 1) * 16}px` }}
      >
        {/* Expand toggle */}
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className={cn(
            "mt-0.5 w-4 h-4 flex-shrink-0 text-muted-foreground",
            !hasChildren && "invisible"
          )}
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? (
            <ChevronDownIcon className="w-3.5 h-3.5" />
          ) : (
            <ChevronRightIcon className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Name + path */}
        <div className="flex-1 min-w-0">
          <span className="font-medium text-foreground">{setting.displayName}</span>
          {showPath && setting.cspPath && (
            <div className="text-xs text-muted-foreground truncate font-mono mt-0.5">
              {setting.cspPath}
            </div>
          )}
        </div>

        {/* Value */}
        <span className="text-muted-foreground ml-4 shrink-0 max-w-xs truncate text-right">
          {formatValue(setting.value)}
        </span>
      </div>

      {/* Children */}
      {expanded &&
        hasChildren &&
        setting.children!.map((child) => (
          <SettingRow
            key={child.id}
            setting={child}
            depth={depth + 1}
            showPath={showPath}
          />
        ))}
    </>
  );
}
