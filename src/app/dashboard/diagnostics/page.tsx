"use client";

import { useState } from "react";

type Row = {
  path: string;
  label: string;
  kind: string;
  status: number;
  ttfb: number;
  total: number;
  bytes: number;
  ok: boolean;
};

type Report = {
  base: string;
  samples: number;
  durationMs: number;
  avgMs: number;
  results: Row[];
};

function fmtBytes(b: number) {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

function badge(ms: number) {
  const color =
    ms < 200
      ? "bg-emerald-500/20 text-emerald-300"
      : ms < 600
      ? "bg-amber-400/20 text-amber-300"
      : "bg-red-500/20 text-red-300";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${color}`}>{ms}ms</span>;
}

export default function DiagnosticsPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [samples, setSamples] = useState(3);
  const [error, setError] = useState("");

  async function run() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/diagnostics?samples=${samples}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to run diagnostics.");
      } else {
        setReport(data);
      }
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  async function warmup() {
    setLoading(true);
    try {
      // Warm pages by fetching them in parallel from the browser
      const targets = [
        "/dashboard",
        "/dashboard/predictions",
        "/dashboard/my-tips",
        "/dashboard/premium",
        "/api/predictions",
        "/api/stats",
      ];
      await Promise.all(targets.map((t) => fetch(t, { cache: "no-store" })));
    } finally {
      setLoading(false);
    }
  }

  const slowest = report
    ? [...report.results].sort((a, b) => b.total - a.total)[0]
    : null;
  const fastest = report
    ? [...report.results].sort((a, b) => a.total - b.total)[0]
    : null;

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Diagnostics</h1>
          <p className="text-sm text-slate-400">
            Measure page load times and warm up the preview server.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
            Samples
            <select
              value={samples}
              onChange={(e) => setSamples(Number(e.target.value))}
              className="bg-transparent text-sm font-semibold text-white outline-none"
            >
              {[1, 3, 5, 10].map((n) => (
                <option key={n} value={n} className="bg-[#111829]">
                  {n}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={warmup}
            disabled={loading}
            className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/5 disabled:opacity-60"
          >
            🔥 Warm up
          </button>
          <button
            onClick={run}
            disabled={loading}
            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-[#0a0f1d] hover:bg-emerald-400 disabled:opacity-60"
          >
            {loading ? "Running…" : "▶ Run perf test"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          {error}
        </div>
      )}

      {!report && !loading && (
        <div className="rounded-2xl border border-dashed border-white/10 p-14 text-center">
          <p className="text-4xl">⚡</p>
          <p className="mt-3 text-lg font-semibold text-white">No test results yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-400">
            Run a perf test to measure TTFB and total response time for every page and API
            route. Warm up first for the most realistic numbers.
          </p>
        </div>
      )}

      {loading && !report && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-xl" />
          ))}
        </div>
      )}

      {report && (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-slate-400">Average</p>
              <p className="mt-1 text-2xl font-black text-emerald-300">{report.avgMs}ms</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-slate-400">Fastest</p>
              <p className="mt-1 text-2xl font-black text-white">
                {fastest?.total}ms
                <span className="ml-2 text-xs font-normal text-slate-500">{fastest?.label}</span>
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-slate-400">Slowest</p>
              <p className="mt-1 text-2xl font-black text-amber-300">
                {slowest?.total}ms
                <span className="ml-2 text-xs font-normal text-slate-500">{slowest?.label}</span>
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-slate-400">Duration</p>
              <p className="mt-1 text-2xl font-black text-white">
                {(report.durationMs / 1000).toFixed(1)}s
              </p>
              <p className="text-xs text-slate-500">{report.samples} samples / route</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Route</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Size</th>
                  <th className="px-4 py-3 text-left font-semibold">TTFB</th>
                  <th className="px-4 py-3 text-left font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {report.results.map((r) => (
                  <tr key={r.path} className="border-t border-white/5">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{r.label}</div>
                      <div className="text-xs text-slate-500">{r.path}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          r.ok
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-red-500/15 text-red-300"
                        }`}
                      >
                        {r.status || "ERR"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{fmtBytes(r.bytes)}</td>
                    <td className="px-4 py-3">{badge(r.ttfb)}</td>
                    <td className="px-4 py-3">{badge(r.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            Tip: run{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5">
              node scripts/perf-test.mjs --samples=10
            </code>{" "}
            from the terminal for repeated samples with concurrency, or{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5">
              node scripts/warmup.mjs --watch
            </code>{" "}
            to keep routes hot. Run{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5">
              node scripts/preview-server.mjs
            </code>{" "}
            instead of <code className="rounded bg-white/10 px-1.5 py-0.5">next start</code> for
            an auto-warming preview with{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5">/__perf</code> live stats.
          </p>
        </>
      )}
    </div>
  );
}
