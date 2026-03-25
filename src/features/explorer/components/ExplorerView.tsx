"use client";

import { useState, useEffect } from "react";
import { usePolicies } from "@/features/explorer/hooks";
import { useExplorerStore, type ExplorerFilters } from "@/features/explorer/store";
import { PolicyList } from "./PolicyList";
import { PolicyCard } from "@/components/shared/policy-card";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SkeletonCard } from "@/components/ui/skeleton";
import { LayoutListIcon, LayoutGridIcon } from "lucide-react";
import { PolicyType, Platform } from "@/domain/enums";
import { getPolicyTypeLabel, getPlatformLabel } from "@/lib/utils";

export function ExplorerView({ initialFilters }: { initialFilters?: ExplorerFilters }) {
  const { filters, viewMode, setFilters, resetFilters, setViewMode } = useExplorerStore();
  const [page, setPage] = useState(1);

  // Sync initial filters from URL into the store (runs once on mount)
  useEffect(() => {
    if (initialFilters && Object.keys(initialFilters).length > 0) {
      resetFilters();
      setFilters(initialFilters);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data, isLoading } = usePolicies(filters, page, 50);

  function handleSearch(q: string) {
    setFilters({ search: q || undefined });
    setPage(1);
  }

  const searchNode = (
    <div className="flex items-center gap-2 flex-wrap">
      <SearchInput
        value={filters.search ?? ""}
        onSearch={handleSearch}
        placeholder="Search policies…"
        className="w-64"
      />
      <Select
        value={filters.policyType ?? "all"}
        onValueChange={(v) => {
          setFilters({ policyType: v === "all" ? undefined : (v as PolicyType) });
          setPage(1);
        }}
      >
        <SelectTrigger className="w-44 h-9">
          <SelectValue placeholder="All types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          {Object.values(PolicyType).map((t) => (
            <SelectItem key={t} value={t}>
              {getPolicyTypeLabel(t)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filters.platform ?? "all"}
        onValueChange={(v) => {
          setFilters({ platform: v === "all" ? undefined : (v as Platform) });
          setPage(1);
        }}
      >
        <SelectTrigger className="w-40 h-9">
          <SelectValue placeholder="All platforms" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All platforms</SelectItem>
          {Object.values(Platform).map((p) => (
            <SelectItem key={p} value={p}>
              {getPlatformLabel(p)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {(filters.policyType || filters.platform || filters.search) && (
        <Button variant="ghost" size="sm" onClick={() => { resetFilters(); setPage(1); }}>
          Clear
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* View mode toggle + stats */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Loading…" : `${data?.total ?? 0} policies`}
        </p>
        <div className="flex items-center gap-1 border border-border rounded-md p-0.5">
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setViewMode("list")}
            aria-label="List view"
          >
            <LayoutListIcon className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setViewMode("grid")}
            aria-label="Grid view"
          >
            <LayoutGridIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {viewMode === "list" ? (
        <PolicyList policies={data?.data} loading={isLoading} searchNode={searchNode} />
      ) : (
        <>
          <div>{searchNode}</div>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {(data?.data ?? []).map((p) => (
                <PolicyCard key={p.id} policy={p} href={`/policies/${p.id}`} compact />
              ))}
            </div>
          )}
        </>
      )}

      {!isLoading && (data?.total ?? 0) > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {(page - 1) * 50 + 1}–{Math.min(page * 50, data?.total ?? 0)} of {data?.total ?? 0}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!data?.hasPreviousPage}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Prev
            </Button>
            <span>Page {data?.page ?? page}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={!data?.hasNextPage}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
