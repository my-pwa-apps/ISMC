import { GlobalSearch } from "@/features/search/components/GlobalSearch";

export const metadata = { title: "Search – Intune GPMC" };

export default function SearchPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Search</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Full-text search across all policies, settings, and assignments
        </p>
      </div>
      <GlobalSearch />
    </div>
  );
}
