"use client";

import {
  LayoutDashboard,
  ShieldAlert,
  Tag,
  AlertCircle,
  Clock,
  Package,
  ArrowRightIcon,
  CopyPlus,
  History,
  ShieldCheck,
} from "lucide-react";
import { useDashboardStats } from "@/features/dashboard/hooks";
import { useTenantDiagnostics } from "@/features/diagnostics/hooks";
import { KpiCard, KpiGridSkeleton } from "./KpiCard";
import { RecentPolicies } from "./RecentPolicies";
import { getPolicyTypeLabel } from "@/lib/utils";
import { PolicyType } from "@/domain/enums";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function DashboardView() {
  const { data: stats, isLoading, error } = useDashboardStats();
  const { data: diagnostics } = useTenantDiagnostics();

  if (error) {
    return (
      <div className="p-6 text-sm text-destructive">
        Failed to load dashboard: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Create Safely</CardTitle>
            <CardDescription>Start from an existing policy instead of authoring from scratch.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground">
              <CopyPlus className="h-4 w-4 text-brand-500" />
              Settings Catalog copy workflow
            </div>
            <p>Open a policy, capture a version, then use Create Copy to branch a new revision.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Version Everything</CardTitle>
            <CardDescription>Snapshots are the rollback backbone for this MVP.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground">
              <History className="h-4 w-4 text-brand-500" />
              Capture before each change
            </div>
            <p>Each snapshot stores the normalized policy plus raw Settings Catalog payload when available.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Write Readiness</CardTitle>
            <CardDescription>Creation and restore stay disabled until the app is explicitly trusted.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-500" />
              <Badge variant={diagnostics?.writeOperationsEnabled ? "primary" : "default"}>
                {diagnostics?.writeOperationsEnabled ? "Write mode enabled" : "Read-only mode"}
              </Badge>
            </div>
            <p>Write actions require both the server flag and the delegated Graph write scope.</p>
          </CardContent>
        </Card>
      </div>

      {/* KPI grid */}
      {isLoading ? (
        <KpiGridSkeleton />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard
            title="Total Policies"
            value={stats?.totalPolicies}
            icon={<Package className="w-5 h-5" />}
            href="/explorer"
            highlight="info"
          />
          <KpiCard
            title="Unassigned"
            value={stats?.unassignedCount}
            description={stats?.unassignedCount ? "Need assignment" : undefined}
            icon={<AlertCircle className="w-5 h-5" />}
            href="/reports/unassigned-policies"
            highlight={stats?.unassignedCount ? "warning" : undefined}
          />
          <KpiCard
            title="Missing Tags"
            value={stats?.missingTagsCount}
            icon={<Tag className="w-5 h-5" />}
            href="/reports/missing-scope-tags"
            highlight={stats?.missingTagsCount ? "warning" : undefined}
          />
          <KpiCard
            title="Stale (90d+)"
            value={stats?.staleCount}
            icon={<Clock className="w-5 h-5" />}
            href="/reports/stale-policies"
            highlight={stats?.staleCount ? "error" : undefined}
          />
          <KpiCard
            title="Conflicts"
            value={stats?.conflictCount}
            icon={<ShieldAlert className="w-5 h-5" />}
            href="/reports/conflicting-settings"
            highlight={stats?.conflictCount ? "error" : undefined}
          />
          <KpiCard
            title="Active Rate"
            value={
              stats?.totalPolicies
                ? `${Math.round(((stats.totalPolicies - (stats.staleCount ?? 0)) / stats.totalPolicies) * 100)}%`
                : "—"
            }
            description="Non-stale policies"
            icon={<LayoutDashboard className="w-5 h-5" />}
          />
        </div>
      )}

      {/* By type breakdown */}
      {stats && Object.keys(stats.byType).length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            By Policy Type
          </h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.byType)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => (
                <div
                  key={type}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-sm"
                >
                  <span className="font-medium">{count}</span>
                  <span className="text-muted-foreground">{getPolicyTypeLabel(type as PolicyType)}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Recent policies */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Recently Changed Policies
          </h2>
          <a
            href="/explorer"
            className="text-xs text-brand-600 hover:underline flex items-center gap-1"
          >
            View all <ArrowRightIcon className="w-3 h-3" />
          </a>
        </div>
        <RecentPolicies policies={stats?.recentlyModified} loading={isLoading} />
      </div>
    </div>
  );
}
