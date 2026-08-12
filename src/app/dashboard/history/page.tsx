"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { PredictionDTO } from "@/components/predictions-ui";

type Filter = "all" | "won" | "lost";

function ResultIcon({ status }: { status: string }) {
  if (status === "won") {
    return (
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-sm font-bold text-emerald-300">
        ✓
      </span>
    );
  }
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-red-500/15 text-sm font-bold text-red-300">
      ✕
    </span>
  );
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date();
  yest.setDate(yest.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yest)) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

export default function HistoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<PredictionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [league, setLeague] = useState("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/predictions");
      const data = await res.json();
      const settled = (data.predictions || [])
        .filter((p: PredictionDTO) => p.status === "won" || p.status === "lost")
        .sort(
          (a: PredictionDTO, b: PredictionDTO) =>
            new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime()
        );
      setItems(settled);
      setLoading(false);
    })();
  }, []);

  const leagues = useMemo(
    () => [...new Set(items.map((p) => p.league))].sort(),
    [items]
  );

  const filtered = useMemo(() => {
    return items.filter((p) => {
      if (filter !== "all" && p.status !== filter) return false;
      if (league !== "all" && p.league !== league) return false;
      if (q) {
        const hay = `${p.homeTeam} ${p.awayTeam} ${p.league}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [items, filter, league, q]);

  const stats = useMemo(() => {
    const won = items.filter((p) => p.status === "won").length;
    const lost = items.length - won;
    const winRate = items.length ? Math.round((won / items.length) * 100) : 0;
    const units = items.reduce(
      (s, p) => s + (p.status === "won" ? p.odds - 1 : -1),
      0
    );
    const roi = items.length ? Math.round((units / items.length) * 100) : 0;
    return { won, lost, winRate, units, roi };
  }, [items]);

  const form = useMemo(() => items.slice(0, 10), [items]);

  const groups = useMemo(() => {
    const map = new Map<string, PredictionDTO[]>();
    for (const p of filtered) {
      const key = new Date(p.matchDate).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return [...map.entries()];
  }, [filtered]);

  const unitStr = (stats.units >= 0 ? "+" : "") + stats.units.toFixed(2);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">History</h1>
        <p className="text-sm text-slate-400">
          Settled results — the track record of past tips.
        </p>
      </div>

      {/* Summary */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))
        ) : (
          <>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-medium text-slate-400">Win rate</p>
              <p className="mt-1 text-3xl font-black text-emerald-400">
                {stats.winRate}%
              </p>
              <p className="text-xs text-slate-500">
                {stats.won}W · {stats.lost}L settled
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-medium text-slate-400">Profit (units)</p>
              <p
                className={`mt-1 text-3xl font-black ${
                  stats.units >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {unitStr}u
              </p>
              <p className="text-xs text-slate-500">1 unit flat stakes</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-medium text-slate-400">ROI</p>
              <p
                className={`mt-1 text-3xl font-black ${
                  stats.roi >= 0 ? "text-teal-300" : "text-red-400"
                }`}
              >
                {stats.roi >= 0 ? "+" : ""}
                {stats.roi}%
              </p>
              <p className="text-xs text-slate-500">return per tip</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-medium text-slate-400">Recent form</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {form.length === 0 ? (
                  <span className="text-xs text-slate-500">—</span>
                ) : (
                  form.map((p) => (
                    <span
                      key={p.id}
                      title={`${p.homeTeam} vs ${p.awayTeam}`}
                      className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold ${
                        p.status === "won"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {p.status === "won" ? "W" : "L"}
                    </span>
                  ))
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500">last {form.length} tips</p>
            </div>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {(["all", "won", "lost"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition ${
                filter === f
                  ? "bg-emerald-500 text-[#0a0f1d]"
                  : "border border-white/10 text-slate-400 hover:text-white"
              }`}
            >
              {f === "won" ? "✓ Won" : f === "lost" ? "✕ Lost" : "All"}
            </button>
          ))}
        </div>
        <select
          value={league}
          onChange={(e) => setLeague(e.target.value)}
          className="rounded-lg border border-white/10 bg-[#0a0f1d] px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
        >
          <option value="all">All leagues</option>
          {leagues.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search teams…"
          className="ml-auto w-full max-w-xs rounded-lg border border-white/10 bg-[#0a0f1d] px-4 py-2 text-sm text-white outline-none focus:border-emerald-500"
        />
      </div>

      {/* Results list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-14 text-center">
          <p className="text-4xl">📜</p>
          <p className="mt-3 text-lg font-semibold text-white">
            No settled predictions yet
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-400">
            {items.length === 0
              ? "History appears here once tips are settled as won or lost."
              : "No results match your filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([day, rows]) => (
            <div key={day}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {dayLabel(rows[0].matchDate)}
              </h2>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                {rows.map((p, idx) => (
                  <div
                    key={p.id}
                    className={`flex items-center gap-4 px-4 py-3.5 ${
                      idx > 0 ? "border-t border-white/5" : ""
                    }`}
                  >
                    <ResultIcon status={p.status} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">
                        {p.homeTeam}{" "}
                        <span className="text-slate-500">vs</span> {p.awayTeam}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {p.league} · {p.market}
                      </p>
                    </div>
                    <div className="hidden shrink-0 text-right sm:block">
                      {p.locked ? (
                        <button
                          onClick={() => router.push("/dashboard/premium")}
                          className="rounded-lg bg-amber-400/15 px-2.5 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-400/25"
                        >
                          🔒 Premium
                        </button>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-emerald-300">
                            {p.tip}
                          </p>
                          <p className="text-xs text-slate-500">@ {p.odds.toFixed(2)}</p>
                        </>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                        p.status === "won"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-red-500/15 text-red-300"
                      }`}
                    >
                      {p.status === "won"
                        ? `+${(p.odds - 1).toFixed(2)}u`
                        : "-1.00u"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-6 text-xs text-slate-500">
        Units assume flat 1u stakes per tip · P/L = (odds − 1) on wins, −1u on losses.
      </p>
    </div>
  );
}
