import { ExplorerView } from "@/features/explorer/components/ExplorerView";

export const metadata = { title: "Policy Explorer – Intune GPMC" };

export default function ExplorerPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Policy Explorer</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse and filter all Intune policies across your tenant
        </p>
      </div>
      <ExplorerView />
    </div>
  );
}
