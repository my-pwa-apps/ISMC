"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSearch } from "@/features/search/hooks";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { SearchIcon } from "lucide-react";
import { PolicyTypeIcon } from "@/components/shared/policy-type-icon";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { getPolicyTypeLabel, getPlatformLabel } from "@/lib/utils";

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const router = useRouter();

  const { data, isLoading, error } = useSearch(query, page);

  function handleSearch(nextQuery: string) {
    setQuery(nextQuery);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <SearchInput
        value={query}
        onSearch={handleSearch}
        placeholder="Search policies, settings, assignments…"
        className="w-full max-w-2xl text-base h-11"
        autoFocus
      />

      {/* Status line */}
      {query.length >= 2 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isLoading ? (
            <Skeleton className="h-4 w-32" />
          ) : data ? (
            <>
              <span>
                {data.total} result{data.total !== 1 ? "s" : ""} for{" "}
                <strong className="text-foreground">{query}</strong>
              </span>
              <span>
                · {(data.page - 1) * data.pageSize + 1}–{Math.min(data.page * data.pageSize, data.total)} shown
              </span>
              <span>· {data.durationMs}ms</span>
            </>
          ) : null}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive">{(error as Error).message}</p>
      )}

      {/* Results */}
      {isLoading && query.length >= 2 ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : data && data.results.length > 0 ? (
        <div className="space-y-4">
          <div className="space-y-2">
            {data.results.map((result) => (
              <button
                key={result.policyId}
                type="button"
                className="w-full text-left flex items-start gap-3 rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
                onClick={() => router.push(`/policies/${result.policyId}`)}
              >
                <PolicyTypeIcon type={result.policyType} className="mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{result.policyName}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <PlatformIcon platform={result.platform} className="w-3 h-3" />
                    {getPlatformLabel(result.platform)} · {getPolicyTypeLabel(result.policyType)}
                  </p>
                  {result.highlights.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {result.highlights.map((h, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {h.field}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Page {data.page}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!data.hasPreviousPage}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!data.hasNextPage}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      ) : query.length >= 2 && data?.total === 0 ? (
        <EmptyState
          title="No results"
          description={`No policies match "${query}". Try different keywords.`}
          icon={<SearchIcon className="w-6 h-6 text-muted-foreground" />}
        />
      ) : query.length < 2 ? (
        <EmptyState
          title="Start typing to search"
          description="Search across policy names, descriptions, settings, and assignments."
          icon={<SearchIcon className="w-6 h-6 text-muted-foreground" />}
        />
      ) : null}
    </div>
  );
}
