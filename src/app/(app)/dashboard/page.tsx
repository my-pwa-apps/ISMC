import { DashboardView } from "@/features/dashboard/components/DashboardView";

export const metadata = { title: "Dashboard – Intune GPMC" };

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-2">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your Intune policy estate
        </p>
      </div>
      <DashboardView />
    </div>
  );
}
