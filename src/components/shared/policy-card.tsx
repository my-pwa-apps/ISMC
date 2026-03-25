"use client";

import Link from "next/link";
import { type PolicyObject } from "@/domain/models";
import { PolicyStatus } from "@/domain/enums";
import { formatRelativeDate, getPolicyTypeLabel, getPlatformLabel } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlatformIcon } from "./platform-icon";
import { PolicyTypeIcon } from "./policy-type-icon";
import { AssignmentBadgeList } from "./assignment-badge";
import { cn } from "@/lib/utils";
import { AlertTriangleIcon, TagIcon } from "lucide-react";

interface PolicyCardProps {
  policy: PolicyObject;
  selected?: boolean;
  compact?: boolean;
  href?: string;
  onClick?: () => void;
}

const statusVariant: Record<
  PolicyStatus,
  "default" | "success" | "warning" | "error" | "info" | "outline" | "primary"
> = {
  [PolicyStatus.Active]: "success",
  [PolicyStatus.Disabled]: "outline",
  [PolicyStatus.Draft]: "warning",
  [PolicyStatus.Archived]: "outline",
};

export function PolicyCard({
  policy,
  selected,
  compact,
  href,
  onClick,
}: PolicyCardProps) {
  const content = (
    <Card
      className={cn(
        "transition-colors cursor-pointer hover:border-brand-600/50",
        selected && "border-brand-600 ring-1 ring-brand-600",
        compact && "shadow-none"
      )}
      onClick={onClick}
    >
      <CardHeader className={cn("pb-2", compact && "p-3 pb-1")}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <PolicyTypeIcon type={policy.policyType} className="shrink-0" />
            <CardTitle className="text-sm truncate" title={policy.displayName}>
              {policy.displayName}
            </CardTitle>
          </div>
          <Badge variant={statusVariant[policy.status]} className="shrink-0 text-xs">
            {policy.status}
          </Badge>
        </div>
        {!compact && policy.description && (
          <CardDescription className="line-clamp-2 text-xs">
            {policy.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className={cn("pt-0", compact ? "px-3 pb-2" : "pb-3")}>
        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
          <span className="flex items-center gap-1">
            <PlatformIcon platform={policy.platform} className="w-3.5 h-3.5" />
            {getPlatformLabel(policy.platform)}
          </span>
          <span>{getPolicyTypeLabel(policy.policyType)}</span>
          {policy.lastModifiedDateTime && (
            <span>{formatRelativeDate(policy.lastModifiedDateTime)}</span>
          )}
        </div>

        {/* Assignments */}
        {policy.assignments && policy.assignments.length > 0 ? (
          <AssignmentBadgeList assignments={policy.assignments} maxVisible={compact ? 2 : 4} />
        ) : (
          <div className="flex items-center gap-1 text-xs text-amber-600">
            <AlertTriangleIcon className="w-3.5 h-3.5" />
            Not assigned
          </div>
        )}

        {/* Scope tags */}
        {!compact && policy.scopeTags && policy.scopeTags.length > 0 && (
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            <TagIcon className="w-3 h-3 text-muted-foreground" />
            {policy.scopeTags.map((t) => (
              <Badge key={t.id} variant="outline" className="text-xs px-1.5 py-0">
                {t.displayName}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
}
