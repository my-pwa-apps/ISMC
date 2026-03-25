"use client";

import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { type DashboardStats } from "@/domain/models";
import { PolicyTypeIcon } from "@/components/shared/policy-type-icon";

type RecentPolicy = DashboardStats["recentlyModified"][number];

interface RecentPoliciesProps {
  policies: RecentPolicy[] | undefined;
  loading: boolean;
}

export function RecentPolicies({ policies, loading }: RecentPoliciesProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border p-4 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!policies || policies.length === 0) {
    return <EmptyState title="No recent policies" description="Policies modified recently will appear here." />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {policies.map((policy) => (
        <Link
          key={policy.policyId}
          href={`/policies/${policy.policyId}`}
          className="flex items-start gap-3 rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
        >
          <PolicyTypeIcon type={policy.policyType} className="mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{policy.displayName}</p>
            <p className="text-xs text-muted-foreground truncate">
              {policy.platform} · {new Date(policy.lastModifiedDateTime).toLocaleDateString()}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
