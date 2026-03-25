import { ComparisonWorkspace } from "@/features/comparison/components/ComparisonWorkspace";

export const metadata = { title: "Compare Policies – Intune GPMC" };

export default function ComparePage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Policy Comparison</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Compare settings side-by-side across up to 5 policies
        </p>
      </div>
      <ComparisonWorkspace />
    </div>
  );
}
