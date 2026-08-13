import type { Metadata } from "next";
import PublicPageShell from "@/components/PublicPageShell";

export const metadata: Metadata = {
  title: "Cookie policy",
  description: "Predikt does not use cookies — sessions are token-based.",
  alternates: { canonical: "/cookies" },
};

export default function CookiesPage() {
  return (
    <PublicPageShell>
      <section className="mx-auto max-w-3xl px-5 py-16 animate-fade-in">
        <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Legal</span>
        <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">Cookie policy</h1>
        <p className="mt-3 text-sm text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>

        <p className="mt-6 leading-relaxed text-slate-400">
          Predikt does <strong className="text-slate-200">not</strong> set any cookies, and we
          do <strong className="text-slate-200">not</strong> use advertising, analytics or
          third-party tracking cookies.
        </p>

        <p className="mt-4 leading-relaxed text-slate-400">
          Instead of a session cookie, signing in creates a session token that is kept in your
          browser&apos;s local session storage (and sent back to our servers as an authorization
          header on each request). The token is cleared when you sign out and expires automatically
          after 30 days.
        </p>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="font-semibold text-white">Payment processor</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            If you use a payment provider such as Paystack, that provider may set its own cookies
            on its own site during checkout. Those cookies are governed by the provider&apos;s
            policies, not ours.
          </p>
        </div>
      </section>
    </PublicPageShell>
  );
}
