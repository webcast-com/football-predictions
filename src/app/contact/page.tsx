import type { Metadata } from "next";
import PublicPageShell from "@/components/PublicPageShell";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Get in touch with the Predikt team — support, partnerships and feedback.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <PublicPageShell>
      <section className="mx-auto grid max-w-5xl gap-10 px-5 py-16 md:grid-cols-2 animate-fade-in">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Contact</span>
          <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">Talk to us</h1>
          <p className="mt-4 leading-relaxed text-slate-400">
            Questions about a payment, a tip, your premium pass, or a partnership? Send a
            message and we&apos;ll get back to you — usually within 24 hours.
          </p>
          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <span className="text-xl">📧</span>
              <div>
                <p className="text-sm font-semibold text-white">Email</p>
                <p className="text-sm text-slate-400">support@predikt.app</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <span className="text-xl">⏱️</span>
              <div>
                <p className="text-sm font-semibold text-white">Response time</p>
                <p className="text-sm text-slate-400">Within 24 hours, 7 days a week</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <span className="text-xl">💳</span>
              <div>
                <p className="text-sm font-semibold text-white">Payment issues?</p>
                <p className="text-sm text-slate-400">
                  Include your Paystack reference for the fastest resolution
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8">
          <ContactForm />
        </div>
      </section>
    </PublicPageShell>
  );
}
