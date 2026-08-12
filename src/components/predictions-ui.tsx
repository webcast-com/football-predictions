"use client";

import { useEffect, useState } from "react";

export type PredictionDTO = {
  id: number;
  userId: number;
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchDate: string;
  market: string;
  tip: string;
  odds: number;
  confidence: number;
  status: string;
  isPremium: boolean;
  analysis: string;
  locked?: boolean;
};

export const MARKETS = [
  "1X2",
  "Over/Under 2.5",
  "BTTS",
  "Double Chance",
  "Correct Score",
  "Handicap",
];

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

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    won: "bg-emerald-500/20 text-emerald-300",
    lost: "bg-red-500/20 text-red-300",
    pending: "bg-amber-400/20 text-amber-300",
  };
  const label: Record<string, string> = {
    won: "✓ Won",
    lost: "✕ Lost",
    pending: "● Pending",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[status] || map.pending}`}>
      {label[status] || status}
    </span>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 80 ? "bg-emerald-400" : value >= 65 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="w-9 shrink-0 text-right text-xs font-semibold text-slate-300">{value}%</span>
    </div>
  );
}

export function PredictionCard({
  p,
  onEdit,
  onDelete,
  onUpgrade,
}: {
  p: PredictionDTO;
  onEdit?: (p: PredictionDTO) => void;
  onDelete?: (p: PredictionDTO) => void;
  onUpgrade?: () => void;
}) {
  const date = new Date(p.matchDate);
  const dateStr = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="group relative flex flex-col rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-emerald-500/30">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">{p.league}</span>
        <div className="flex items-center gap-2">
          {p.isPremium && (
            <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-xs font-semibold text-amber-300">
              ⭐ VIP
            </span>
          )}
          <StatusBadge status={p.status} />
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-base font-bold text-white">{p.homeTeam}</span>
        <span className="text-xs text-slate-500">vs</span>
        <span className="text-base font-bold text-white">{p.awayTeam}</span>
      </div>

      <p className="mb-3 text-xs text-slate-500">🗓️ {dateStr}</p>

      {p.locked ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-amber-400/30 bg-amber-400/5 p-4 text-center">
          <p className="text-2xl">🔒</p>
          <p className="mt-1 text-sm font-semibold text-amber-200">Premium tip locked</p>
          <button
            onClick={onUpgrade}
            className="mt-2 rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold text-[#0a0f1d] hover:bg-amber-300"
          >
            Unlock with Premium
          </button>
        </div>
      ) : (
        <>
          <div className="mb-3 rounded-xl bg-[#0a0f1d] p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">{p.market}</p>
                <p className="text-sm font-bold text-emerald-300">{p.tip}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Odds</p>
                <p className="text-sm font-bold text-white">{p.odds.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="mb-3">
            <ConfidenceBar value={p.confidence} />
          </div>
          {p.analysis && (
            <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-slate-400">{p.analysis}</p>
          )}
        </>
      )}

      {(onEdit || onDelete) && (
        <div className="mt-auto flex gap-2 pt-2">
          {onEdit && (
            <button
              onClick={() => onEdit(p)}
              className="flex-1 rounded-lg border border-white/10 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/5"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(p)}
              className="flex-1 rounded-lg border border-red-500/20 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/10"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export type FormData = {
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchDate: string;
  market: string;
  tip: string;
  odds: string;
  confidence: number;
  status: string;
  isPremium: boolean;
  analysis: string;
};

const empty: FormData = {
  homeTeam: "",
  awayTeam: "",
  league: "Premier League",
  matchDate: "",
  market: "1X2",
  tip: "",
  odds: "1.80",
  confidence: 70,
  status: "pending",
  isPremium: false,
  analysis: "",
};

export function PredictionModal({
  open,
  initial,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: PredictionDTO | null;
  saving: boolean;
  onClose: () => void;
  onSave: (data: FormData) => void;
}) {
  const [form, setForm] = useState<FormData>(empty);

  useEffect(() => {
    if (initial) {
      setForm({
        homeTeam: initial.homeTeam,
        awayTeam: initial.awayTeam,
        league: initial.league,
        matchDate: new Date(initial.matchDate).toISOString().slice(0, 16),
        market: initial.market,
        tip: initial.tip,
        odds: String(initial.odds),
        confidence: initial.confidence,
        status: initial.status,
        isPremium: initial.isPremium,
        analysis: initial.analysis,
      });
    } else {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(18, 0, 0, 0);
      setForm({ ...empty, matchDate: d.toISOString().slice(0, 16) });
    }
  }, [initial, open]);

  if (!open) return null;

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const field = "w-full rounded-lg border border-white/10 bg-[#0a0f1d] px-3 py-2 text-sm text-white outline-none focus:border-emerald-500";
  const label = "mb-1 block text-xs font-medium text-slate-400";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-lg animate-fade-in rounded-2xl border border-white/10 bg-[#111829] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            {initial ? "Edit prediction" : "New prediction"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(form);
          }}
          className="space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Home team</label>
              <input className={field} required value={form.homeTeam} onChange={(e) => update("homeTeam", e.target.value)} />
            </div>
            <div>
              <label className={label}>Away team</label>
              <input className={field} required value={form.awayTeam} onChange={(e) => update("awayTeam", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>League</label>
              <select className={field} value={form.league} onChange={(e) => update("league", e.target.value)}>
                {LEAGUES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Kick-off</label>
              <input type="datetime-local" className={field} required value={form.matchDate} onChange={(e) => update("matchDate", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Market</label>
              <select className={field} value={form.market} onChange={(e) => update("market", e.target.value)}>
                {MARKETS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Tip</label>
              <input className={field} required placeholder="e.g. Home Win" value={form.tip} onChange={(e) => update("tip", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Odds</label>
              <input type="number" step="0.01" min="1" className={field} value={form.odds} onChange={(e) => update("odds", e.target.value)} />
            </div>
            <div>
              <label className={label}>Status</label>
              <select className={field} value={form.status} onChange={(e) => update("status", e.target.value)}>
                <option value="pending">Pending</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </div>
          </div>

          <div>
            <label className={label}>Confidence: {form.confidence}%</label>
            <input type="range" min="0" max="100" className="w-full accent-emerald-500" value={form.confidence} onChange={(e) => update("confidence", Number(e.target.value))} />
          </div>

          <div>
            <label className={label}>Analysis</label>
            <textarea rows={3} className={field} value={form.analysis} onChange={(e) => update("analysis", e.target.value)} placeholder="Why this tip?" />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" className="h-4 w-4 accent-amber-400" checked={form.isPremium} onChange={(e) => update("isPremium", e.target.checked)} />
            Mark as ⭐ Premium VIP tip
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-white/10 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-[#0a0f1d] hover:bg-emerald-400 disabled:opacity-60">
              {saving ? "Saving…" : initial ? "Save changes" : "Create tip"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="skeleton mb-3 h-3 w-24 rounded" />
      <div className="skeleton mb-3 h-5 w-full rounded" />
      <div className="skeleton mb-3 h-16 w-full rounded-xl" />
      <div className="skeleton h-2 w-full rounded" />
    </div>
  );
}
