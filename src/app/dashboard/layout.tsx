import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser, isPremiumActive } from "@/lib/auth";
import { ensureSeed } from "@/lib/seed";
import Sidebar from "@/components/Sidebar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
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
