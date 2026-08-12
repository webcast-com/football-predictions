import type { Metadata } from "next";
import Link from "next/link";
import PublicPageShell from "@/components/PublicPageShell";

export const metadata: Metadata = {
  title: "About us",
  description:
    "Predikt delivers data-driven football predictions: free daily tips and premium VIP picks over a KES 100 / 24-hour pass.",
  alternates: { canonical: "/about" },
};

const values = [
  { icon: "📊", title: "Data first", desc: "Every tip is backed by form, head-to-head and situational stats — never guesswork." },
  { icon: "🔒", title: "Transparent", desc: "Our full settled history of every won and lost tip is public inside the app." },
  { icon: "💳", title: "Fair pricing", desc: "No subscriptions you forget about. Pay KES 100 when you want 24 hours of access — that’s it." },
  { icon: "🛡️", title: "Responsible", desc: "We publish confidence scores so you can judge risk; 18+ only, bet responsibly." },
];

export default function AboutPage() {
  return (
    <PublicPageShell>
      <section className="mx-auto max-w-4xl px-5 py-16 animate-fade-in">
        <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">About us</span>
        <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">
          Football predictions you can actually verify
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-slate-300">
          Predikt started with a simple frustration: tip sites that hide their track record.
          We built the opposite — a platform where every tip is timestamped, settled and
          visible in a public history, so our win rate speaks for itself.
        </p>
        <p className="mt-4 leading-relaxed text-slate-400">
          We cover the Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Eredivisie and
          more. Free members get daily tips and full stats; Premium members unlock every
          high-confidence VIP pick for 24 hours with a single KES 100 payment via Paystack
          (M-Pesa and cards supported).
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {values.map((v) => (
            <div key={v.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-2xl">{v.icon}</div>
              <h3 className="mt-2 font-semibold text-white">{v.title}</h3>
              <p className="mt-1 text-sm text-slate-400">{v.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
          <h2 className="text-xl font-bold text-white">Ready to see today&apos;s tips?</h2>
          <p className="mt-2 text-sm text-slate-300">
            Create a free account and browse the feed — upgrade only when it makes sense for you.
          </p>
          <Link
            href="/register"
            className="mt-5 inline-block rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-[#0a0f1d] hover:bg-emerald-400"
          >
            Create free account
          </Link>
        </div>
      </section>
    </PublicPageShell>
  );
}
