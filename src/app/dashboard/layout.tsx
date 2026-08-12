import type { ReactNode } from "react";
import { getCurrentUser, isPremiumActive } from "@/lib/auth";
import { ensureSeed } from "@/lib/seed";
import Sidebar from "@/components/Sidebar";
import DashboardGate from "@/components/DashboardGate";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    // No session cookie (e.g. embedded preview blocking third-party cookies).
    // Let the client re-authenticate via the stored session token instead of
    // bouncing straight back to /login.
    return <DashboardGate>{children}</DashboardGate>;
  }
  await ensureSeed();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar
        name={user.name}
        email={user.email}
        premiumActive={isPremiumActive(user)}
      />
      <main className="min-w-0 flex-1 bg-[#0a0f1d]">
        <div className="mx-auto max-w-6xl px-5 py-8">{children}</div>
      </main>
    </div>
  );
}
