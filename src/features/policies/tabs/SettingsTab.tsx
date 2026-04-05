"use client";

import { useState, useMemo, useEffect } from "react";
import { type PolicyObject, type PolicySetting } from "@/domain/models";
import { SearchInput } from "@/components/ui/search-input";
import { SettingRow } from "@/components/shared/setting-row";
import { EmptyState } from "@/components/ui/empty-state";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";

interface SettingsTabProps {
  policy: PolicyObject;
}

/** Extract the top-level category from a setting's path */
function getCategory(setting: PolicySetting): string {
  if (!setting.path) return "General";
  const parts = setting.path.split(/[>\/]/);
  return parts[0]?.trim() || "General";
}

function CategoryGroup({ category, settings, defaultOpen }: {
  category: string;
  settings: PolicySetting[];
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        className="w-full flex items-center gap-2 px-4 py-2 bg-muted/60 hover:bg-muted text-xs font-medium text-muted-foreground border-b border-border transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <ChevronDownIcon className="w-3.5 h-3.5" /> : <ChevronRightIcon className="w-3.5 h-3.5" />}
        <span className="flex-1 text-left">{category}</span>
        <span className="text-2xs opacity-60">{settings.length}</span>
      </button>
      {open && settings.map((s) => <SettingRow key={s.id} setting={s} showPath />)}
    </div>
  );
}

export function SettingsTab({ policy }: SettingsTabProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce the search query to avoid re-renders on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(timer);
  }, [query]);

  const settings = policy.settings ?? [];

  const filtered = useMemo(
    () =>
      debouncedQuery
        ? settings.filter(
            (s) =>
              s.displayName.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
              (s.cspPath ?? "").toLowerCase().includes(debouncedQuery.toLowerCase()) ||
              (s.path ?? "").toLowerCase().includes(debouncedQuery.toLowerCase())
          )
        : settings,
    [settings, debouncedQuery]
  );

  // Group by category only when not searching
  const grouped = !debouncedQuery
    ? filtered.reduce<Record<string, PolicySetting[]>>((acc, s) => {
        const cat = getCategory(s);
        (acc[cat] ??= []).push(s);
        return acc;
      }, {})
    : null;

  const categoryCount = grouped ? Object.keys(grouped).length : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {settings.length} setting{settings.length !== 1 ? "s" : ""}
          {!debouncedQuery && categoryCount > 1 && ` · ${categoryCount} categories`}
          {debouncedQuery && ` — ${filtered.length} match${filtered.length !== 1 ? "es" : ""}`}
        </p>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Filter settings…"
          className="w-56"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={debouncedQuery ? "No matching settings" : "No settings configured"}
          description={
            debouncedQuery
              ? "Try a different search term."
              : "This policy has no configurable settings."
          }
        />
      ) : (
        <div className="rounded-md border border-border overflow-hidden">
          {grouped && categoryCount > 1 ? (
            Object.entries(grouped).map(([cat, catSettings], i) => (
              <CategoryGroup
                key={cat}
                category={cat}
                settings={catSettings}
                defaultOpen={i === 0}
              />
            ))
          ) : (
            filtered.map((setting) => (
              <SettingRow key={setting.id} setting={setting} showPath />
            ))
          )}
        </div>
      )}
    </div>
  );
}
