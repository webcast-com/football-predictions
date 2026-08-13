"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authFetch } from "@/lib/client-auth";

type Me = {
  plan: string;
  premiumActive: boolean;
  premiumUntil: string | null;
  premiumHoursLeft: number;
  price: number;
  currency: string;
  passHours: number;
};

function PremiumInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err" | "info"; text: string } | null>(null);

  async function loadMe() {
    const data = await authFetch("/api/auth/me").then((r) => r.json());
    setMe(data.user);
  }

  useEffect(() => {
    loadMe();
  }, []);

  // Handle Paystack callback verification
  useEffect(() => {
    const reference = params.get("reference") || params.get("trxref");
    if (params.get("verify") === "1" && reference) {
      setMessage({ type: "info", text: "Verifying your payment…" });
      authFetch(`/api/paystack/verify?reference=${encodeURIComponent(reference)}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success) {
            setMessage({ type: "ok", text: "🎉 Payment confirmed — +24h Premium unlocked!" });
            loadMe();
          } else {
            setMessage({ type: "err", text: d.error || "Payment was not completed." });
          }
          router.replace("/dashboard/premium");
        });
    }
  }, [params, router]);

  async function upgrade() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await authFetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "premium-24h" }),
      });
      const data = await res.json();
      if (res.ok && data.authorization_url) {
        window.location.href = data.authorization_url;
        return;
      }
      if (res.status === 503) {
        // Paystack not configured — use demo upgrade so the flow is testable
        setMessage({ type: "info", text: "Paystack keys not set — completing in demo mode…" });
        const demo = await authFetch("/api/paystack/demo-upgrade", { method: "POST" });
        if (demo.ok) {
          setMessage({ type: "ok", text: "🎉 +24h Premium unlocked (demo mode)!" });
          loadMe();
        } else {
          setMessage({ type: "err", text: "Demo upgrade failed." });
        }
      } else {
        setMessage({ type: "err", text: data.error || "Could not start checkout." });
      }
    } catch {
      setMessage({ type: "err", text: "Network error." });
    } finally {
      setLoading(false);
    }
  }

  const isPremium = me?.premiumActive;
  const price = me?.price ?? 100;
  const currency = me?.currency ?? "KES";
  const hours = me?.passHours ?? 24;

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Premium</h1>
        <p className="text-sm text-slate-400">
          {currency} {price} unlocks all VIP picks for {hours} hours — paid via Paystack.
        </p>
      </div>

      {message && (
        <div
          className={`mb-5 rounded-lg border px-4 py-3 text-sm ${
            message.type === "ok"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : message.type === "err"
              ? "border-red-500/30 bg-red-500/10 text-red-300"
              : "border-sky-500/30 bg-sky-500/10 text-sky-300"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 24h pass card */}
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">24-Hour Premium Pass</h2>
            {isPremium && (
              <span className="rounded-full bg-amber-400/20 px-3 py-1 text-xs font-bold text-amber-300">
                ACTIVE
              </span>
            )}
          </div>

          {isPremium && me?.premiumUntil && (
            <div className="mt-4 rounded-xl bg-[#0a0f1d] p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Time remaining</span>
                <span className="font-bold text-emerald-300">
                  {me.premiumHoursLeft}h left
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-400"
                  style={{
                    width: `${Math.min(100, (me.premiumHoursLeft / hours) * 100)}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Expires {new Date(me.premiumUntil).toLocaleString()}
              </p>
            </div>
          )}

          <p className="mt-5 text-4xl font-black text-white">
            {currency} {price}
            <span className="text-base font-normal text-slate-400"> / {hours} hrs</span>
          </p>
          <p className="mt-1 text-sm text-emerald-300">
            {isPremium
              ? "Buy again to stack another 24 hours onto your pass"
              : "One payment = full VIP access for 24 hours"}
          </p>

          <button
            onClick={upgrade}
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-[#0a0f1d] hover:bg-emerald-400 disabled:opacity-60"
          >
            {loading
              ? "Starting checkout…"
              : isPremium
              ? `💳 Add +${hours}h — ${currency} ${price}`
              : `💳 Pay ${currency} ${price} with Paystack`}
          </button>
          <p className="mt-3 text-center text-xs text-slate-400">
            Secure checkout via Paystack · M-Pesa &amp; cards supported
          </p>
        </div>

        {/* Benefits */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <h3 className="text-base font-semibold text-white">What you get for 24 hours</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            <li className="flex gap-2"><span>⭐</span> All premium VIP picks unlocked</li>
            <li className="flex gap-2"><span>📈</span> Higher-confidence selections</li>
            <li className="flex gap-2"><span>⚡</span> Priority access to top daily tips</li>
            <li className="flex gap-2"><span>🔔</span> Full match analysis on every tip</li>
            <li className="flex gap-2"><span>♾️</span> Unlimited personal predictions</li>
          </ul>
          <div className="mt-6 rounded-xl border border-white/10 bg-[#0a0f1d] p-4 text-xs leading-relaxed text-slate-400">
            <p className="font-semibold text-slate-300">How the 24h pass works</p>
            <p className="mt-1">
              Your clock starts the moment payment succeeds. When time runs out your
              account returns to the Free plan automatically — no recurring charges, you
              only pay when you want access again.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PremiumPage() {
  return (
    <Suspense fallback={<div className="text-slate-400">Loading…</div>}>
      <PremiumInner />
    </Suspense>
  );
}
