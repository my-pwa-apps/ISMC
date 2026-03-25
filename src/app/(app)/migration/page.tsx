import { MigrationWorkspace } from "@/features/migration/components/MigrationWorkspace";

export const metadata = { title: "GPO Migration – Intune GPMC" };

export default function MigrationPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">GPO Migration</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Assess Group Policy Objects for migration readiness to Microsoft Intune
        </p>
      </div>
      <MigrationWorkspace />
    </div>
  );
}
