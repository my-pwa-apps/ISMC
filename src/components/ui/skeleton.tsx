/**
 * Skeleton loading component.
 */

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("shimmer rounded animate-pulse bg-gray-200", className)}
      aria-hidden="true"
    />
  );
}

/** Multiple skeleton rows for a table or list */
export function SkeletonRows({ count = 5, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

/** Skeleton for KPI cards */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("bg-white rounded-lg shadow-card border border-border p-5", className)}>
      <Skeleton className="h-3 w-24 mb-3" />
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-2 w-32" />
    </div>
  );
}
