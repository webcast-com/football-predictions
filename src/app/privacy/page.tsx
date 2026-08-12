import type { Metadata } from "next";
import PublicPageShell from "@/components/PublicPageShell";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Predikt collects, uses and protects your personal data.",
  alternates: { canonical: "/privacy" },
};

const sections = [
  {
    title: "Data we collect",
    body: "When you register we store your name, email address and a securely hashed password (or a Supabase Auth identifier when Supabase authentication is enabled). We also store the predictions you create, your subscription status and payment references. We never see or store your card or M-Pesa details — those are handled entirely by Paystack.",
  },
  {
    title: "How we use your data",
    body: "Your data is used to authenticate you, personalise your dashboard, track your predictions, and process premium 24-hour passes. Aggregated, de-identified statistics (such as overall win rates) may be shown publicly but never contain personal information.",
  },
  {
    title: "Payments",
    body: "Payments are processed by Paystack. During checkout we share your email address with Paystack to initialize the transaction, and Paystack sends us a signed webhook confirming whether the payment succeeded. We store only the transaction reference, amount, currency and status.",
  },
  {
    title: "Third-party processors",
    body: "We use Supabase (authentication and database hosting when configured), Paystack (payments) and standard hosting infrastructure. Each processor handles data only as required to provide their service and under their own privacy terms.",
  },
  {
    title: "Data retention & your rights",
    body: "Account data is retained while your account is active. You may request a copy or deletion of your personal data at any time via the contact page. Payment records are kept as required for accounting and audit purposes.",
  },
  {
    title: "Security",
    body: "Connections are encrypted in transit (HTTPS/TLS). Passwords are stored using salted scrypt hashes, sessions use http-only cookies, and API keys never leave the server. Access to production data is restricted and audited.",
  },
];

export default function PrivacyPage() {
  return (
    <PublicPageShell>
      <section className="mx-auto max-w-3xl px-5 py-16 animate-fade-in">
        <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Legal</span>
        <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">Privacy policy</h1>
        <p className="mt-3 text-sm text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="mt-10 space-y-8">
          {sections.map((s, i) => (
            <div key={s.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="font-semibold text-white">
                {i + 1}. {s.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.body}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-sm text-slate-500">
          Questions about this policy? Reach us through the{" "}
          <a href="/contact" className="text-emerald-400 hover:underline">contact page</a>.
        </p>
      </section>
    </PublicPageShell>
  );
}
