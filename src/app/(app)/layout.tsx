import { SessionProvider } from "next-auth/react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

const isMockMode = process.env.NEXT_PUBLIC_ENABLE_MOCK === "true";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const demoMode = cookieStore.get("ismc_demo_mode")?.value === "1";

  let session = null;
  if (!isMockMode && !demoMode) {
    session = await auth();
    if (!session) {
      redirect("/login");
    }
  }

  return (
    <SessionProvider session={session}>
      <div className="app-shell">
        <Sidebar />
        <div className="flex flex-col min-h-0" style={{ gridColumn: 2, gridRow: "1 / -1", display: "flex", flexDirection: "column" }}>
          <Header />
          <main className="app-shell-main flex-1">
            {children}
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}
