"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PredictionCard, CardSkeleton, type PredictionDTO } from "@/components/predictions-ui";

const FILTERS = ["all", "pending", "won", "lost", "premium"] as const;
type Filter = (typeof FILTERS)[number];

export default function PredictionsPage() {
  const router = useRouter();
  const [items, setItems] = useState<PredictionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/predictions");
      const data = await res.json();
      setItems(data.predictions || []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((p) => {
      if (filter === "premium" && !p.isPremium) return false;
      if (filter !== "all" && filter !== "premium" && p.status !== filter) return false;
      if (q) {
        const hay = `${p.homeTeam} ${p.awayTeam} ${p.league}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [items, filter, q]);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Predictions</h1>
        <p className="text-sm text-slate-400">Expert football tips across the top leagues.</p>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition ${
                filter === f
                  ? "bg-emerald-500 text-[#0a0f1d]"
                  : "border border-white/10 text-slate-400 hover:text-white"
              }`}
            >
              {f === "premium" ? "⭐ Premium" : f}
            </button>
          ))}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search teams or leagues…"
          className="ml-auto w-full max-w-xs rounded-lg border border-white/10 bg-[#0a0f1d] px-4 py-2 text-sm text-white outline-none focus:border-emerald-500"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-white/10 p-12 text-center">
            <p className="text-3xl">🔍</p>
            <p className="mt-2 font-semibold text-white">No predictions match your filters</p>
            <p className="text-sm text-slate-400">Try a different filter or search term.</p>
          </div>
        ) : (
          filtered.map((p) => (
            <PredictionCard
              key={p.id}
              p={p}
              onUpgrade={() => router.push("/dashboard/premium")}
            />
          ))
        )}
      </div>
    </div>
  );
}
