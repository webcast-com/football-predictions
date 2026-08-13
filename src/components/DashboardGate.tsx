"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/client-auth";
import Sidebar from "@/components/Sidebar";

type GateUser = {
  name: string;
  email: string;
  premiumActive: boolean;
};

/**
 * Client-side auth gate for the dashboard.
 *
 * Sessions are token-based and the token lives client-side (sessionStorage),
 * so the server cannot authenticate page loads itself. This gate
 * re-authenticates on the client using the token (sent as
 * `Authorization: Bearer`) and only then renders the dashboard shell +
 * children; without a valid session it redirects to /login.
 */
export default function DashboardGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<GateUser | null | "loading">("loading");

  useEffect(() => {
    let cancelled = false;
    authFetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d?.user) {
          setUser({
            name: d.user.name,
            email: d.user.email,
            premiumActive: Boolean(d.user.premiumActive),
          });
          // Ensure demo data exists for token-authed sessions.
          authFetch("/api/seed", { method: "POST" }).catch(() => {});
        } else {
          setUser(null);
        }
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (user === null) {
      router.replace("/login");
    }
  }, [user, router]);

  if (!user || user === "loading") {
    return (
      <div className="grid min-h-screen place-items-center bg-[#0a0f1d]">
        <div className="animate-pulse text-sm text-slate-400">
          Loading your dashboard…
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar name={user.name} email={user.email} premiumActive={user.premiumActive} />
      <main className="min-w-0 flex-1 bg-[#0a0f1d]">
        <div className="mx-auto max-w-6xl px-5 py-8">{children}</div>
      </main>
    </div>
  );
}
