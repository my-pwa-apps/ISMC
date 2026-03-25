"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: number | string | undefined;
  description?: string;
  icon: ReactNode;
  href?: string;
  highlight?: "warning" | "error" | "success" | "info";
  loading?: boolean;
}

const highlightBorder = {
  warning: "border-l-4 border-l-amber-400",
  error: "border-l-4 border-l-red-500",
  success: "border-l-4 border-l-green-500",
  info: "border-l-4 border-l-brand-600",
};

export function KpiCard({
  title,
  value,
  description,
  icon,
  href,
  highlight,
  loading,
}: KpiCardProps) {
  const inner = (
    <Card className={cn("hover:shadow-md transition-shadow", highlight && highlightBorder[highlight])}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              {title}
            </p>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-3xl font-bold text-foreground tabular-nums">
                {value ?? "—"}
              </p>
            )}
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className="text-muted-foreground mt-1">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
        {inner}
      </Link>
    );
  }
  return inner;
}

export function KpiGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-5 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
