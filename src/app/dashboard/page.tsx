"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PredictionCard, CardSkeleton, type PredictionDTO } from "@/components/predictions-ui";

type Stats = {
  total: number;
  won: number;
  lost: number;
  pending: number;
  winRate: number;
  avgOdds: number;
  premiumCount: number;
};

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className={`mt-1 text-3xl font-black ${accent}`}>{value}</p>
    </div>
  );
}

export default function OverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<PredictionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [premium, setPremium] = useState(false);

  useEffect(() => {
    (async () => {
      const [s, p] = await Promise.all([
        fetch("/api/stats").then((r) => r.json()),
        fetch("/api/predictions").then((r) => r.json()),
      ]);
      setStats(s);
      setRecent((p.predictions || []).slice(0, 6));
      setPremium(p.premium);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Overview</h1>
          <p className="text-sm text-slate-400">Your prediction performance at a glance.</p>
        </div>
        {!premium && (
          <Link href="/dashboard/premium" className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-[#0a0f1d] hover:bg-amber-300">
            ⭐ Upgrade to Premium
          </Link>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading || !stats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))
        ) : (
          <>
            <StatCard label="Win rate" value={`${stats.winRate}%`} accent="text-emerald-400" />
            <StatCard label="Total tips" value={String(stats.total)} accent="text-white" />
            <StatCard label="Pending" value={String(stats.pending)} accent="text-amber-300" />
            <StatCard label="Avg winning odds" value={stats.avgOdds.toFixed(2)} accent="text-teal-300" />
          </>
        )}
      </div>

      <div className="mt-8 mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Latest predictions</h2>
        <Link href="/dashboard/predictions" className="text-sm font-medium text-emerald-400 hover:underline">
          View all →
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
        ) : recent.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-white/10 p-10 text-center text-slate-400">
            No predictions yet.
          </div>
        ) : (
          recent.map((p) => (
            <PredictionCard key={p.id} p={p} onUpgrade={() => (window.location.href = "/dashboard/premium")} />
          ))
        )}
      </div>
    </div>
  );
}
