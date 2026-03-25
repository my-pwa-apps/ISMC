import { AuditView } from "@/features/audit/components/AuditView";

export const metadata = { title: "Audit Log – Intune GPMC" };

export default function AuditPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Activity history for policy views, snapshots, and governance actions
        </p>
      </div>
      <AuditView />
    </div>
  );
}
