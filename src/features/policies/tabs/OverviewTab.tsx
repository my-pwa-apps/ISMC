"use client";

import { type PolicyObject } from "@/domain/models";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { PolicyTypeIcon } from "@/components/shared/policy-type-icon";
import { AssignmentBadgeList } from "@/components/shared/assignment-badge";
import {
  getPolicyTypeLabel,
  getPlatformLabel,
  formatAbsoluteDate,
  formatRelativeDate,
} from "@/lib/utils";
import { TagIcon } from "lucide-react";

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
