import type { Metadata } from "next";
import PublicPageShell from "@/components/PublicPageShell";

export const metadata: Metadata = {
  title: "Cookie policy",
  description: "Which cookies Predikt uses and why — only essential session cookies.",
  alternates: { canonical: "/cookies" },
};

const cookies = [
  {
    name: "fp_session",
    type: "Essential",
    duration: "30 days",
    desc: "Keeps you signed in securely. http-only so it cannot be read by scripts. Required for the app to work.",
  },
  {
    name: "NEXT_LOCALE / flags",
    type: "Preferences",
    duration: "Session",
    desc: "Remembers interface preferences such as collapsed menus. Not used for tracking.",
  },
];

export default function CookiesPage() {
  return (
    <PublicPageShell>
      <section className="mx-auto max-w-3xl px-5 py-16 animate-fade-in">
        <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Legal</span>
        <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">Cookie policy</h1>
        <p className="mt-3 text-sm text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>

        <p className="mt-6 leading-relaxed text-slate-400">
          Predikt is intentionally light on cookies. We do{" "}
          <strong className="text-slate-200">not</strong> use advertising, analytics or
          third-party tracking cookies. Only the essential cookies below are set:
        </p>

        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Cookie</th>
                <th className="px-4 py-3 text-left font-semibold">Type</th>
                <th className="px-4 py-3 text-left font-semibold">Duration</th>
                <th className="hidden px-4 py-3 text-left font-semibold sm:table-cell">Purpose</th>
              </tr>
            </thead>
            <tbody>
              {cookies.map((c) => (
                <tr key={c.name} className="border-t border-white/5">
                  <td className="px-4 py-3 font-mono text-xs text-emerald-300">{c.name}</td>
                  <td className="px-4 py-3 text-slate-300">{c.type}</td>
                  <td className="px-4 py-3 text-slate-400">{c.duration}</td>
                  <td className="hidden px-4 py-3 text-slate-400 sm:table-cell">{c.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="font-semibold text-white">Managing cookies</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            You can block or delete cookies in your browser settings at any time. Blocking the
            session cookie will sign you out and prevent you from using the dashboard. Payment
            provider Paystack may set its own cookies during checkout — those are governed by
            Paystack&apos;s policies, not ours.
          </p>
        </div>
      </section>
    </PublicPageShell>
  );
}
