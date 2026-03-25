"use client";

import { usePolicyDetails } from "@/features/policies/hooks";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PolicyTypeIcon } from "@/components/shared/policy-type-icon";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { getPlatformLabel, getPolicyTypeLabel } from "@/lib/utils";
import { OverviewTab } from "@/features/policies/tabs/OverviewTab";
import { SettingsTab } from "@/features/policies/tabs/SettingsTab";
import { AssignmentsTab } from "@/features/policies/tabs/AssignmentsTab";
import { VersionHistoryTab } from "@/features/policies/tabs/VersionHistoryTab";
import { RawJsonTab } from "@/features/policies/tabs/RawJsonTab";
import { useComparisonStore } from "@/features/comparison/store";
import { ExternalLinkIcon, GitCompareIcon } from "lucide-react";

/** Build the Intune portal deep-link for a given policy */
function buildIntuneUrl(policyId: string): string {
  return `https://intune.microsoft.com/#view/Microsoft_Intune_DeviceSettings/DeviceConfigurationMenuBlade/~/overview/policyId/${policyId}`;
}

interface PolicyDetailsViewProps {
  policyId: string;
}

export function PolicyDetailsView({ policyId }: PolicyDetailsViewProps) {
  const { data: policy, isLoading, error } = usePolicyDetails(policyId);
  const { selectedIds, addPolicy, removePolicy } = useComparisonStore();
  const inComparison = selectedIds.includes(policyId);
  const atMax = selectedIds.length >= 2;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-96" />
        <Skeleton className="h-5 w-64" />
        <div className="flex gap-2 mt-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !policy) {
    return (
      <div className="p-8 text-center text-sm text-destructive">
        {(error as Error)?.message ?? "Policy not found."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <PolicyTypeIcon type={policy.policyType} className="w-6 h-6 mt-0.5 shrink-0" />
          <div>
            <h1 className="text-xl font-semibold leading-tight">{policy.displayName}</h1>
            <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
              <PlatformIcon platform={policy.platform} className="w-3.5 h-3.5" />
              {getPlatformLabel(policy.platform)} · {getPolicyTypeLabel(policy.policyType)}
              {policy.settingCount !== undefined && ` · ${policy.settingCount} settings`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant={inComparison ? "secondary" : "outline"}
            size="sm"
            onClick={() => inComparison ? removePolicy(policyId) : addPolicy(policyId)}
            disabled={!inComparison && atMax}
            title={inComparison ? "Remove from compare" : atMax ? "Compare supports 2 policies" : "Add to compare"}
          >
            <GitCompareIcon className="w-3.5 h-3.5 mr-1.5" />
            {inComparison ? "In Compare" : "Compare"}
          </Button>
          <a
            href={buildIntuneUrl(policyId)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 h-7 px-2.5 text-xs font-medium rounded border border-border bg-transparent hover:bg-muted transition-colors"
          >
            <ExternalLinkIcon className="w-3.5 h-3.5" />
            Open in Intune
          </a>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="settings">
            Settings {policy.settingCount ? `(${policy.settingCount})` : ""}
          </TabsTrigger>
          <TabsTrigger value="assignments">
            Assignments {policy.assignments ? `(${policy.assignments.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="history">Version History</TabsTrigger>
          <TabsTrigger value="raw">Raw JSON</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab policy={policy} />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsTab policy={policy} />
        </TabsContent>

        <TabsContent value="assignments">
          <AssignmentsTab policy={policy} />
        </TabsContent>

        <TabsContent value="history">
          <VersionHistoryTab policyId={policyId} />
        </TabsContent>

        <TabsContent value="raw">
          <RawJsonTab policy={policy} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
