import { type PolicyAssignment } from "@/domain/models";
import { AssignmentTargetType, AssignmentIntent } from "@/domain/enums";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface AssignmentBadgeProps {
  assignment: PolicyAssignment;
  compact?: boolean;
}

const targetTypeLabel: Record<AssignmentTargetType, string> = {
  [AssignmentTargetType.AllDevices]: "All Devices",
  [AssignmentTargetType.AllUsers]: "All Users",
  [AssignmentTargetType.Group]: "Group",
  [AssignmentTargetType.ExcludeGroup]: "Exclude Group",
  [AssignmentTargetType.AllLicensedUsers]: "All Licensed Users",
  [AssignmentTargetType.Unknown]: "Unknown",
};

const intentVariant: Record<
  AssignmentIntent,
  "default" | "success" | "warning" | "error" | "info" | "outline" | "primary"
> = {
  [AssignmentIntent.Required]: "primary",
  [AssignmentIntent.RequiredAndAvailable]: "primary",
  [AssignmentIntent.Available]: "info",
  [AssignmentIntent.Uninstall]: "warning",
};

export function AssignmentBadge({ assignment, compact }: AssignmentBadgeProps) {
  const targetType = assignment.target.type;
  const targetLabel = targetTypeLabel[targetType] ?? "Unknown";

  const displayLabel =
    targetType === AssignmentTargetType.Group ||
    targetType === AssignmentTargetType.ExcludeGroup
      ? (assignment.target.groupDisplayName ?? targetLabel)
      : targetLabel;

  const badge = (
    <Badge
      variant={assignment.intent ? (intentVariant[assignment.intent] ?? "outline") : "outline"}
      dot={
        targetType === AssignmentTargetType.AllDevices ||
        targetType === AssignmentTargetType.AllUsers
      }
      className={cn("max-w-[180px] truncate", compact && "text-xs px-1.5 py-0")}
    >
      {compact ? targetLabel : displayLabel}
    </Badge>
  );

  if (compact && displayLabel !== targetLabel) {
    return <Tooltip content={displayLabel}>{badge}</Tooltip>;
  }

  return badge;
}

interface AssignmentBadgeListProps {
  assignments: PolicyAssignment[];
  maxVisible?: number;
}

export function AssignmentBadgeList({ assignments, maxVisible = 3 }: AssignmentBadgeListProps) {
  const visible = assignments.slice(0, maxVisible);
  const overflow = assignments.length - maxVisible;

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((a) => (
        <AssignmentBadge key={a.id} assignment={a} compact />
      ))}
      {overflow > 0 && (
        <Tooltip
          content={assignments
            .slice(maxVisible)
            .map((a) => a.target.groupDisplayName ?? a.target.type)
            .join(", ")}
        >
          <Badge variant="outline" className="text-xs">
            +{overflow}
          </Badge>
        </Tooltip>
      )}
    </div>
  );
}
