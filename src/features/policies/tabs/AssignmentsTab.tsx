"use client";

import { type PolicyObject } from "@/domain/models";
import { AssignmentTargetType } from "@/domain/enums";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AssignmentBadge } from "@/components/shared/assignment-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Users2Icon, MonitorIcon, GroupIcon, MinusCircleIcon, FilterIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AssignmentsTabProps {
  policy: PolicyObject;
}

export function AssignmentsTab({ policy }: AssignmentsTabProps) {
  const assignments = policy.assignments ?? [];

  if (assignments.length === 0) {
    return (
      <EmptyState
        title="No assignments"
        description="This policy is not assigned to any group, users, or devices."
        icon={<Users2Icon className="w-6 h-6 text-amber-500" />}
      />
    );
  }

  const allDevices = assignments.filter(
    (a) => a.target.type === AssignmentTargetType.AllDevices
  );
  const allUsers = assignments.filter(
    (a) => a.target.type === AssignmentTargetType.AllUsers
  );
  const groups = assignments.filter(
    (a) => a.target.type === AssignmentTargetType.Group
  );
  const excluded = assignments.filter(
    (a) => a.target.type === AssignmentTargetType.ExcludeGroup
  );

  return (
    <div className="space-y-4">
      {allDevices.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MonitorIcon className="w-4 h-4" /> All Devices
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {allDevices.map((a) => (
              <AssignmentBadge key={a.id} assignment={a} />
            ))}
          </CardContent>
        </Card>
      )}

      {allUsers.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users2Icon className="w-4 h-4" /> All Users
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {allUsers.map((a) => (
              <AssignmentBadge key={a.id} assignment={a} />
            ))}
          </CardContent>
        </Card>
      )}

      {groups.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <GroupIcon className="w-4 h-4" /> Groups ({groups.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {groups.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <span className="text-sm font-medium">
                    {a.target.groupDisplayName ?? a.target.groupId ?? "Unknown group"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {a.target.filter && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5 cursor-help">
                            <FilterIcon className="w-3 h-3" />
                            {a.target.filter.displayName}
                          </span>
                        </TooltipTrigger>
                        {a.target.filter.rule && (
                          <TooltipContent side="left" className="max-w-xs font-mono text-xs break-all">
                            {a.target.filter.rule}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    )}
                    <AssignmentBadge assignment={a} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {excluded.length > 0 && (
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-red-700 dark:text-red-400">
              <MinusCircleIcon className="w-4 h-4" /> Excluded Groups ({excluded.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {excluded.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <span className="text-sm font-medium line-through text-muted-foreground">
                    {a.target.groupDisplayName ?? a.target.groupId ?? "Unknown group"}
                  </span>
                  <Badge variant="error" className="text-xs">Excluded</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(() => {
        const filtersUsed = assignments
          .map((a) => a.target.filter)
          .filter((f): f is NonNullable<typeof f> => f != null);
        // Deduplicate by ID
        const uniqueFilters = [...new Map(filtersUsed.map((f) => [f.id, f])).values()];
        if (uniqueFilters.length === 0) return null;
        return (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FilterIcon className="w-4 h-4" /> Assignment Filters ({uniqueFilters.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {uniqueFilters.map((f) => (
                  <div key={f.id} className="py-1.5 border-b border-border last:border-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{f.displayName}</span>
                      <span className="text-xs text-muted-foreground">{f.platform}</span>
                    </div>
                    {f.rule && (
                      <code className="block mt-1 text-xs bg-muted px-2 py-1 rounded font-mono text-muted-foreground break-all">
                        {f.rule}
                      </code>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })()}
    </div>
  );
}
