"use client";

import { type PolicyObject } from "@/domain/models";
import { AssignmentTargetType } from "@/domain/enums";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssignmentBadge } from "@/components/shared/assignment-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Users2Icon, MonitorIcon, GroupIcon } from "lucide-react";

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
    (a) =>
      a.target.type === AssignmentTargetType.Group ||
      a.target.type === AssignmentTargetType.ExcludeGroup
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
                  <AssignmentBadge assignment={a} />
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
        if (filtersUsed.length === 0) return null;
        return (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Assignment Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {filtersUsed.map((f) => (
                  <div key={f.id} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                    <span className="text-sm">{f.displayName}</span>
                    <span className="text-xs text-muted-foreground">{f.platform}</span>
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
