/**
 * Badge component for status indicators and labels.
 */

import { type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-muted text-muted-foreground",
        primary: "bg-brand-100 text-brand-700",
        success: "bg-status-success-bg text-status-success",
        warning: "bg-status-warning-bg text-status-warning",
        error: "bg-status-error-bg text-status-error",
        info: "bg-status-info-bg text-status-info",
        outline: "border border-border text-muted-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full flex-shrink-0",
            variant === "success" && "bg-status-success",
            variant === "warning" && "bg-status-warning",
            variant === "error" && "bg-status-error",
            variant === "info" && "bg-status-info",
            !variant || variant === "default" ? "bg-muted-foreground" : ""
          )}
        />
      )}
      {children}
    </span>
  );
}
