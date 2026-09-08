"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const LEAGUES = [
  "Premier League",
  "La Liga",
  "Serie A",
  "Bundesliga",
  "Ligue 1",
  "Champions League",
  "Europa League",
  "Other",
];

const SAMPLE_TIPS = [
  {
    homeTeam: "Arsenal",
    awayTeam: "Chelsea",
    league: "Premier League",
    market: "1X2",
    tip: "Home Win",
    odds: 1.85,
    confidence: 82,
  },
  {
    homeTeam: "Real Madrid",
    awayTeam: "Barcelona",
    league: "La Liga",
    market: "Over/Under 2.5",
    tip: "Over 2.5 Goals",
    odds: 1.72,
    confidence: 78,
  },
  {
    homeTeam: "Bayern Munich",
    awayTeam: "Dortmund",
    league: "Bundesliga",
    market: "BTTS",
    tip: "Both Teams to Score",
    odds: 1.65,
    confidence: 85,
  },
];

function HeroContent() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-24 text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-300">
        ⚡ Live data-driven football tips
      </span>
      <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-black leading-tight text-white sm:text-6xl">
        Win more with{" "}
        <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
          smarter football predictions
        </span>
      </h1>
      <p className="mx-auto mt-5 max-w-xl text-lg text-slate-400">
        Expert tips across the world&apos;s top leagues. Start free, then unlock
        premium VIP picks with high-confidence odds. Pay securely with Paystack.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/register"
          className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-[#0a0f1d] hover:bg-emerald-400"
        >
          Create free account
        </Link>
        <Link
          href="/login"
          className="rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-white hover:bg-white/5"
        >
          View predictions
        </Link>
      </div>
    </div>
  );
}

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="mb-8 flex items-center justify-center gap-2">
      {[1, 2, 3].map((s) => (
        <div
          key={s}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            s <= step ? "w-8 bg-emerald-500" : "w-4 bg-white/10"
          }`}
        />
      ))}
    </div>
  );
}

function SampleTipCard({
  homeTeam,
  awayTeam,
  league,
  market,
  tip,
  odds,
  confidence,
}: (typeof SAMPLE_TIPS)[number]) {
  const color =
    confidence >= 80 ? "bg-emerald-400" : confidence >= 65 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-medium text-slate-400">{league}</span>
        <span className="text-[10px] font-semibold text-emerald-300">✓ Won</span>
      </div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-white">{homeTeam}</span>
        <span className="text-[10px] text-slate-500">vs</span>
        <span className="text-sm font-bold text-white">{awayTeam}</span>
      </div>
      <div className="flex items-center justify-between rounded-lg bg-[#0a0f1d] p-2">
        <div>
          <p className="text-[9px] text-slate-500">{market}</p>
          <p className="text-xs font-bold text-emerald-300">{tip}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-slate-500">Odds</p>
          <p className="text-xs font-bold text-white">{odds.toFixed(2)}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div className={`h-full rounded-full ${color}`} style={{ width: `${confidence}%` }} />
        </div>
        <span className="text-[9px] font-semibold text-slate-300">{confidence}%</span>
      </div>
    </div>
  );
}

export default function OnboardingHero() {
  const [mounted, setMounted] = useState(false);
  const [onboarding, setOnboarding] = useState(false);
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
    setOnboarding(!localStorage.getItem("predikt_onboarding_seen"));
  }, []);

  function dismiss() {
    localStorage.setItem("predikt_onboarding_seen", "1");
    setOnboarding(false);
  }

  function toggleLeague(l: string) {
    setSelected((prev) =>
      prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]
    );
  }

  // SSR + before mount: render normal hero to avoid hydration mismatch
  if (!mounted || !onboarding) {
    return <HeroContent />;
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 text-center animate-fade-in">
      <StepIndicator step={step} />

      {/* Step 1: Pick leagues */}
      {step === 1 && (
        <div>
          <h1 className="mx-auto max-w-2xl text-3xl font-black leading-tight text-white sm:text-4xl">
            Pick your{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              favourite leagues
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-slate-400">
            We&apos;ll prioritize tips from the leagues you care about most.
          </p>
          <div className="mx-auto mt-8 grid max-w-md grid-cols-2 gap-2">
            {LEAGUES.map((l) => {
              const active = selected.includes(l);
              return (
                <button
                  key={l}
                  onClick={() => toggleLeague(l)}
                  className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "border-emerald-500 bg-emerald-500/15 text-emerald-300"
                      : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                  }`}
                >
                  {active && "✓ "}
                  {l}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setStep(2)}
            disabled={selected.length === 0}
            className="mt-8 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-[#0a0f1d] hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue →
          </button>
          <button
            onClick={dismiss}
            className="mt-3 block w-full text-xs text-slate-500 hover:text-slate-300"
          >
            Skip for now
          </button>
        </div>
      )}

      {/* Step 2: Sample tips */}
      {step === 2 && (
        <div>
          <h1 className="mx-auto max-w-2xl text-3xl font-black leading-tight text-white sm:text-4xl">
            Here&apos;s what{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              you&apos;ll get
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-slate-400">
            Expert tips with confidence scores, odds, and analysis — across the leagues you love.
          </p>
          <div className="mx-auto mt-8 grid max-w-md gap-3 sm:grid-cols-3">
            {SAMPLE_TIPS.map((t, i) => (
              <SampleTipCard key={i} {...t} />
            ))}
          </div>
          <button
            onClick={() => setStep(3)}
            className="mt-8 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-[#0a0f1d] hover:bg-emerald-400"
          >
            Looks great →
          </button>
          <button
            onClick={() => setStep(1)}
            className="mt-3 ml-3 text-xs text-slate-500 hover:text-slate-300"
          >
            ← Back
          </button>
        </div>
      )}

      {/* Step 3: Create account */}
      {step === 3 && (
        <div>
          <div className="mx-auto mb-6 text-5xl">⚽</div>
          <h1 className="mx-auto max-w-2xl text-3xl font-black leading-tight text-white sm:text-4xl">
            Ready to start{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              winning?
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-slate-400">
            Create a free account to get daily tips, track your stats, and unlock premium VIP picks anytime.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              onClick={dismiss}
              className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-[#0a0f1d] hover:bg-emerald-400"
            >
              Create free account
            </Link>
            <Link
              href="/login"
              onClick={dismiss}
              className="rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-white hover:bg-white/5"
            >
              I already have one
            </Link>
          </div>
          <button
            onClick={dismiss}
            className="mt-3 block w-full text-xs text-slate-500 hover:text-slate-300"
          >
            Maybe later
          </button>
        </div>
      )}
    </div>
  );
}
