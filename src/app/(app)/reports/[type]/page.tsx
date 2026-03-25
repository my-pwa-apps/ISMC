import { ReportsView } from "@/features/reports/components/ReportsView";
import { notFound } from "next/navigation";

const VALID_REPORTS = [
  "unassigned-policies",
  "missing-scope-tags",
  "stale-policies",
  "overlapping-assignments",
  "conflicting-settings",
  "duplicate-policies",
  "settings-usage",
  "migration-readiness",
] as const;

const REPORT_TITLES: Record<string, string> = {
  "unassigned-policies": "Unassigned Policies",
  "missing-scope-tags": "Missing Scope Tags",
  "stale-policies": "Stale Policies",
  "overlapping-assignments": "Overlapping Assignments",
  "conflicting-settings": "Conflicting Settings",
  "duplicate-policies": "Duplicate Policies",
  "settings-usage": "Settings Usage",
  "migration-readiness": "Migration Readiness",
};

interface PageProps {
  params: Promise<{ type: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { type } = await params;
  return { title: `${REPORT_TITLES[type] ?? "Report"} – Intune GPMC` };
}

export default async function ReportPage({ params }: PageProps) {
  const { type } = await params;
  if (!VALID_REPORTS.includes(type as (typeof VALID_REPORTS)[number])) notFound();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">{REPORT_TITLES[type]}</h1>
      </div>
      <ReportsView reportType={type} />
    </div>
  );
}
