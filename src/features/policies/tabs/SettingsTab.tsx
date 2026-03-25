"use client";

import { useState } from "react";
import { type PolicyObject } from "@/domain/models";
import { SearchInput } from "@/components/ui/search-input";
import { SettingRow } from "@/components/shared/setting-row";
import { EmptyState } from "@/components/ui/empty-state";

interface SettingsTabProps {
  policy: PolicyObject;
}

export function SettingsTab({ policy }: SettingsTabProps) {
  const [query, setQuery] = useState("");

  const settings = policy.settings ?? [];

  const filtered = query
    ? settings.filter(
        (s) =>
          s.displayName.toLowerCase().includes(query.toLowerCase()) ||
          (s.cspPath ?? "").toLowerCase().includes(query.toLowerCase())
      )
    : settings;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {settings.length} setting{settings.length !== 1 ? "s" : ""}
          {query && ` — ${filtered.length} match${filtered.length !== 1 ? "es" : ""}`}
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
          title={query ? "No matching settings" : "No settings configured"}
          description={
            query
              ? "Try a different search term."
              : "This policy has no configurable settings."
          }
        />
      ) : (
        <div className="rounded-md border border-border overflow-hidden">
          {filtered.map((setting) => (
            <SettingRow key={setting.id} setting={setting} showPath />
          ))}
        </div>
      )}
    </div>
  );
}
