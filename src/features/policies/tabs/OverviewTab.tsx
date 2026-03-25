"use client";

import { type PolicyObject } from "@/domain/models";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { PolicyTypeIcon } from "@/components/shared/policy-type-icon";
import { AssignmentBadgeList } from "@/components/shared/assignment-badge";
import {
  getPolicyTypeLabel,
  getPlatformLabel,
  formatAbsoluteDate,
  formatRelativeDate,
} from "@/lib/utils";
import { AlertTriangleIcon, TagIcon, UsersIcon, ShieldAlertIcon } from "lucide-react";
import { AssignmentImpactService } from "@/services/assignmentImpactService";
import { OverlapSeverity } from "@/domain/enums";

const overlapSeverityVariant: Record<OverlapSeverity, "success" | "outline" | "warning" | "error"> = {
  [OverlapSeverity.None]: "success",
  [OverlapSeverity.Low]: "outline",
  [OverlapSeverity.Medium]: "warning",
  [OverlapSeverity.High]: "error",
  [OverlapSeverity.Critical]: "error",
};

const impactService = new AssignmentImpactService();

interface OverviewTabProps {
  policy: PolicyObject;
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[160px,1fr] gap-2 py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm">{children}</span>
    </div>
  );
}

export function OverviewTab({ policy }: OverviewTabProps) {
  const impact = impactService.compute(policy);

  return (
    <div className="space-y-6">
      {/* Core metadata */}
      <Card>
        <CardContent className="p-4 divide-y divide-border">
          <MetaRow label="Display name">{policy.displayName}</MetaRow>
          <MetaRow label="Policy type">
            <span className="flex items-center gap-1.5">
              <PolicyTypeIcon type={policy.policyType} />
              {getPolicyTypeLabel(policy.policyType)}
            </span>
          </MetaRow>
          <MetaRow label="Platform">
            <span className="flex items-center gap-1.5">
              <PlatformIcon platform={policy.platform} />
              {getPlatformLabel(policy.platform)}
            </span>
          </MetaRow>
          <MetaRow label="Status">
            <Badge variant={policy.status === "Active" ? "success" : "outline"}>
              {policy.status}
            </Badge>
          </MetaRow>
          {policy.description && (
            <MetaRow label="Description">
              <span className="text-muted-foreground">{policy.description}</span>
            </MetaRow>
          )}
          <MetaRow label="ID">
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
              {policy.id}
            </code>
          </MetaRow>
          {policy.createdDateTime && (
            <MetaRow label="Created">
              {formatAbsoluteDate(policy.createdDateTime)}{" "}
              <span className="text-muted-foreground text-xs ml-1">
                ({formatRelativeDate(policy.createdDateTime)})
              </span>
            </MetaRow>
          )}
          {policy.lastModifiedDateTime && (
            <MetaRow label="Last modified">
              {formatAbsoluteDate(policy.lastModifiedDateTime)}{" "}
              <span className="text-muted-foreground text-xs ml-1">
                ({formatRelativeDate(policy.lastModifiedDateTime)})
              </span>
            </MetaRow>
          )}
          <MetaRow label="Settings count">
            {policy.settingCount ?? 0} settings
          </MetaRow>
        </CardContent>
      </Card>

      {/* Assignment Impact */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <UsersIcon className="w-4 h-4" /> Assignment Impact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{impact.coverageSummary.narrative}</p>

          {impact.warnings.length > 0 && (
            <div className="space-y-1.5">
              {impact.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 dark:bg-amber-950/20 rounded px-3 py-2">
                  <AlertTriangleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {w}
                </div>
              ))}
            </div>
          )}

          {impact.overlappingPolicies.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                <ShieldAlertIcon className="w-3.5 h-3.5" />
                Overlapping policies ({impact.overlappingPolicies.length})
              </p>
              <div className="space-y-1.5">
                {impact.overlappingPolicies.map((op) => (
                  <div key={op.policyId} className="flex items-center justify-between py-1 px-2 rounded border border-border text-sm">
                    <span className="truncate font-medium">{op.policyName}</span>
                    <Badge variant={overlapSeverityVariant[op.severity]} className="text-xs ml-2 shrink-0">
                      {op.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {impact.overlappingPolicies.length === 0 && impact.warnings.length === 0 && (
            <p className="text-sm text-green-700">No assignment warnings detected.</p>
          )}
        </CardContent>
      </Card>

      {/* Scope tags */}
      {policy.scopeTags && policy.scopeTags.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2 flex items-center gap-1.5">
            <TagIcon className="w-4 h-4" /> Scope Tags
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {policy.scopeTags.map((t) => (
              <Badge key={t.id} variant="outline">
                {t.displayName}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Assignments summary */}
      <div>
        <h3 className="text-sm font-medium mb-2">
          Assignments ({policy.assignments?.length ?? 0})
        </h3>
        {policy.assignments && policy.assignments.length > 0 ? (
          <AssignmentBadgeList assignments={policy.assignments} maxVisible={20} />
        ) : (
          <p className="text-sm text-amber-600">This policy has no assignments.</p>
        )}
      </div>
    </div>
  );
}
