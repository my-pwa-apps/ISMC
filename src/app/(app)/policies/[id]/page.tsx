import { PolicyDetailsView } from "@/features/policies/components/PolicyDetailsView";

export const metadata = { title: "Policy Details – Intune GPMC" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PolicyPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className="p-6">
      <PolicyDetailsView policyId={id} />
    </div>
  );
}
