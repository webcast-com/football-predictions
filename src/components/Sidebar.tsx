"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: "📊" },
  { href: "/dashboard/predictions", label: "Predictions", icon: "⚽" },
  { href: "/dashboard/history", label: "History", icon: "📜" },
  { href: "/dashboard/my-tips", label: "My Tips", icon: "✍️" },
  { href: "/dashboard/premium", label: "Premium", icon: "⭐" },
  { href: "/dashboard/diagnostics", label: "Diagnostics", icon: "⚡" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar({
  name,
  email,
  premiumActive,
}: {
  name: string;
  email: string;
  premiumActive: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const initials = name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0a0f1d] px-4 py-3 md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-white">
          <img src="/logo.png" alt="Predikt logo" className="h-8 w-8 rounded-lg" />
          Predikt
        </Link>
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      <aside
        className={`${
          open ? "block" : "hidden"
        } w-full shrink-0 border-r border-white/10 bg-[#0b1120] md:block md:w-64`}
      >
        <div className="flex h-full flex-col p-4">
          <Link
            href="/dashboard"
            className="mb-6 hidden items-center gap-2 px-2 text-lg font-bold text-white md:flex"
          >
          <img src="/logo.png" alt="Predikt logo" className="h-9 w-9 rounded-lg" />
          Predikt
        </Link>

          <nav className="flex-1 space-y-1">
            {NAV.map((item) => {
              const active =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-300">
                {initials || "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{name}</p>
                <p className="truncate text-xs text-slate-500">{email}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  premiumActive
                    ? "bg-amber-400/20 text-amber-300"
                    : "bg-slate-500/20 text-slate-400"
                }`}
              >
                {premiumActive ? "⭐ Premium" : "Free plan"}
              </span>
              <button
                onClick={logout}
                className="text-xs font-medium text-slate-400 hover:text-red-400"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
