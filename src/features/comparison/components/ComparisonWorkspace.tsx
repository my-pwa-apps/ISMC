"use client";

import { useState } from "react";
import { useComparisonStore } from "@/features/comparison/store";
import { useComparison } from "@/features/comparison/hooks";
import { usePolicies } from "@/features/explorer/hooks";
import { SettingsMatrix } from "./SettingsMatrix";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Badge } from "@/components/ui/badge";
import { PolicyTypeIcon } from "@/components/shared/policy-type-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { XIcon, PlusCircleIcon, GitCompareIcon } from "lucide-react";

export function ComparisonWorkspace() {
  const { selectedIds, addPolicy, removePolicy, clearPolicies } = useComparisonStore();
  const [search, setSearch] = useState("");
  const { data: policyData, isLoading: policiesLoading } = usePolicies({ search: search || undefined }, 1, 50);
  const { data: result, isLoading: comparing, error } = useComparison(selectedIds);

  return (
    <div className="space-y-6">
      {/* Policy selector */}
      <div className="rounded-lg border border-border p-4 space-y-3">
        <h2 className="text-sm font-semibold">Select Policies to Compare (2–5)</h2>

        {/* Selected chips */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedIds.map((id) => {
              const policy = policyData?.data?.find((p) => p.id === id);
              return (
                <Badge key={id} variant="primary" className="flex items-center gap-1.5 pr-1">
                  {policy ? (
                    <>
                      <PolicyTypeIcon type={policy.policyType} className="w-3 h-3" />
                      <span className="max-w-[160px] truncate">{policy.displayName}</span>
                    </>
                  ) : (
                    <span className="font-mono text-xs">{id}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => removePolicy(id)}
                    className="ml-1 rounded hover:bg-brand-700 p-0.5"
                    aria-label="Remove"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                </Badge>
              );
            })}
            <Button variant="ghost" size="sm" onClick={clearPolicies}>
              Clear all
            </Button>
          </div>
        )}

        {/* Search + list */}
        {selectedIds.length < 5 && (
          <>
            <SearchInput
              value={search}
              onSearch={setSearch}
              placeholder="Search policies to add…"
              className="w-full max-w-sm"
            />
            {policiesLoading ? (
              <div className="space-y-1.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full" />
                ))}
              </div>
            ) : (
              <div className="divide-y divide-border rounded-md border border-border max-h-60 overflow-y-auto">
                {(policyData?.data ?? [])
                  .filter((p) => !selectedIds.includes(p.id))
                  .slice(0, 20)
                  .map((policy) => (
                    <button
                      key={policy.id}
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted/40 transition-colors"
                      onClick={() => addPolicy(policy.id)}
                    >
                      <PolicyTypeIcon type={policy.policyType} />
                      <span className="flex-1 truncate">{policy.displayName}</span>
                      <PlusCircleIcon className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Comparison result */}
      {selectedIds.length < 2 ? (
        <EmptyState
          title="Select at least 2 policies"
          description="Add policies above to compare their settings side-by-side."
          icon={<GitCompareIcon className="w-6 h-6 text-muted-foreground" />}
        />
      ) : comparing ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : error ? (
        <div className="text-sm text-destructive p-4">
          {(error as Error).message}
        </div>
      ) : result ? (
        <SettingsMatrix result={result} />
      ) : null}
    </div>
  );
}
