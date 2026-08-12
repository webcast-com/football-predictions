"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Me = {
  name: string;
  email: string;
  plan: string;
  premiumActive: boolean;
  premiumUntil: string | null;
};

export default function SettingsPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMe(d.user));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const row = "flex items-center justify-between border-b border-white/5 py-3 last:border-0";

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-slate-400">Manage your account.</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-2 text-sm font-semibold text-white">Profile</h2>
        {!me ? (
          <div className="space-y-3">
            <div className="skeleton h-5 w-full rounded" />
            <div className="skeleton h-5 w-2/3 rounded" />
          </div>
        ) : (
          <div className="text-sm">
            <div className={row}>
              <span className="text-slate-400">Name</span>
              <span className="font-medium text-white">{me.name}</span>
            </div>
            <div className={row}>
              <span className="text-slate-400">Email</span>
              <span className="font-medium text-white">{me.email}</span>
            </div>
            <div className={row}>
              <span className="text-slate-400">Plan</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  me.premiumActive
                    ? "bg-amber-400/20 text-amber-300"
                    : "bg-slate-500/20 text-slate-300"
                }`}
              >
                {me.premiumActive ? "⭐ Premium" : "Free"}
              </span>
            </div>
            {me.premiumActive && me.premiumUntil && (
              <div className={row}>
                <span className="text-slate-400">Premium until</span>
                <span className="font-medium text-white">
                  {new Date(me.premiumUntil).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-1 text-sm font-semibold text-white">Session</h2>
        <p className="mb-4 text-sm text-slate-400">Sign out of your account on this device.</p>
        <button
          onClick={logout}
          className="rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-500/10"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
