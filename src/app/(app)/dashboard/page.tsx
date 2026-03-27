import { DashboardView } from "@/features/dashboard/components/DashboardView";

export const metadata = { title: "Policy Lifecycle" };

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-2">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Policy Lifecycle</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Focused on create-from-existing, version capture, and fast rollback through restored policy copies.
        </p>
      </div>
      <DashboardView />
    </div>
  );
}
