"use client";

import { useEffect, useRef, useState } from "react";

type ROIPoint = {
  date: string;
  cumulativeProfit: number;
  profit: number;
  homeTeam: string;
  awayTeam: string;
  league: string;
  market: string;
  tip: string;
  odds: number;
  status: string;
};

type ROIData = {
  points: ROIPoint[];
  summary: {
    totalProfit: number;
    roi: number;
    tipsCount: number;
    wonCount: number;
    winRate: number;
  };
};

function StatPill({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-0.5 text-lg font-black ${accent}`}>{value}</p>
    </div>
  );
}

function Chart({ data }: { data: ROIData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { points, summary } = data;

  const height = 240;
  const padL = 40;
  const padR = 12;
  const padT = 14;
  const padB = 26;
  const plotW = Math.max(0, width - padL - padR);
  const plotH = height - padT - padB;

  // Scales
  const profits = points.map((p) => p.cumulativeProfit);
  const minP = Math.min(0, ...profits);
  const maxP = Math.max(0, ...profits);
  const range = maxP - minP || 1;

  const xAt = (i: number) =>
    padL + (points.length <= 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const yAt = (v: number) => padT + plotH - ((v - minP) / range) * plotH;

  // Build line path
  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xAt(i).toFixed(1)} ${yAt(p.cumulativeProfit).toFixed(1)}`)
    .join(" ");

  // Area fill path (down to the zero line or min)
  const baselineY = yAt(Math.max(0, minP));
  const areaPath =
    points.length > 0
      ? `${linePath} L ${xAt(points.length - 1).toFixed(1)} ${baselineY.toFixed(1)} L ${xAt(0).toFixed(1)} ${baselineY.toFixed(1)} Z`
      : "";

  // Y grid values
  const yGridVals = [minP, minP + range * 0.5, maxP].filter(
    (v, i, arr) => Math.round(v * 100) !== Math.round(arr[i - 1] * 100 || Infinity)
  );

  // X label indices: first, middle, last
  const xLabelIdx =
    points.length <= 3
      ? points.map((_, i) => i)
      : [0, Math.floor((points.length - 1) / 2), points.length - 1];

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  // Hover handling
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (points.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - padL;
    const i = Math.round((x / plotW) * (points.length - 1));
    setHoverIdx(Math.max(0, Math.min(points.length - 1, i)));
  };

  const hovered = hoverIdx !== null ? points[hoverIdx] : null;
  const hoverX = hoverIdx !== null ? xAt(hoverIdx) : 0;
  const hoverY = hoverIdx !== null ? yAt(points[hoverIdx].cumulativeProfit) : 0;

  // Tooltip position (clamp within container)
  const tooltipLeft = Math.max(60, Math.min(width - 60, hoverX));
  const isPositive = summary.totalProfit >= 0;

  if (points.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center text-sm text-slate-500">
        No settled predictions yet — ROI chart will appear here.
      </div>
    );
  }

  return (
    <div>
      {/* Summary stats */}
      <div className="mb-4 grid grid-cols-4 gap-2">
        <StatPill
          label="Profit"
          value={`${isPositive ? "+" : ""}${summary.totalProfit.toFixed(1)}u`}
          accent={isPositive ? "text-emerald-400" : "text-red-400"}
        />
        <StatPill
          label="ROI"
          value={`${summary.roi.toFixed(1)}%`}
          accent={summary.roi >= 0 ? "text-emerald-400" : "text-red-400"}
        />
        <StatPill label="Tips" value={String(summary.tipsCount)} accent="text-white" />
        <StatPill label="Win rate" value={`${summary.winRate}%`} accent="text-teal-300" />
      </div>

      {/* Chart */}
      <div
        ref={containerRef}
        className="relative w-full select-none"
        style={{ height }}
        onMouseMove={onMove}
        onMouseLeave={() => setHoverIdx(null)}
        onTouchStart={(e) => {
          if (points.length === 0) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.touches[0].clientX - rect.left - padL;
          const i = Math.max(0, Math.min(points.length - 1, Math.round((x / plotW) * (points.length - 1))));
          setHoverIdx(i);
        }}
      >
        <svg width={width} height={height} className="overflow-visible">
          <defs>
            <linearGradient id="roiArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines + Y labels */}
          {yGridVals.map((v) => (
            <g key={v}>
              <line
                x1={padL}
                y1={yAt(v)}
                x2={width - padR}
                y2={yAt(v)}
                stroke="#ffffff"
                strokeOpacity={v === 0 ? 0.15 : 0.05}
                strokeDasharray={v === 0 ? "" : "3 3"}
              />
              <text x={padL - 6} y={yAt(v) + 3} textAnchor="end" className="fill-slate-500 text-[9px]">
                {v.toFixed(1)}
              </text>
            </g>
          ))}

          {/* Area fill */}
          {areaPath && <path d={areaPath} fill="url(#roiArea)" />}

          {/* Line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#34d399"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {/* X labels */}
          {xLabelIdx.map((i) => (
            <text
              key={i}
              x={xAt(i)}
              y={height - 8}
              textAnchor="middle"
              className="fill-slate-500 text-[9px]"
            >
              {fmtDate(points[i].date)}
            </text>
          ))}

          {/* Hover indicator */}
          {hovered && (
            <g>
              <line
                x1={hoverX}
                y1={padT}
                x2={hoverX}
                y2={height - padB}
                stroke="#34d399"
                strokeOpacity={0.4}
                strokeDasharray="3 3"
              />
              <circle cx={hoverX} cy={hoverY} r={4} fill="#34d399" stroke="#0a0f1d" strokeWidth={2} />
            </g>
          )}
        </svg>

        {/* Tooltip */}
        {hovered && (
          <div
            className="pointer-events-none absolute z-10 w-44 -translate-x-1/2 rounded-xl border border-white/10 bg-[#111829] p-3 shadow-xl"
            style={{
              left: tooltipLeft,
              top: Math.max(0, hoverY - 90),
            }}
          >
            <p className="text-[10px] text-slate-400">{fmtDate(hovered.date)}</p>
            <p className="mt-1 text-xs font-bold text-white">
              {hovered.homeTeam} <span className="text-slate-500">vs</span> {hovered.awayTeam}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-400">
              {hovered.market} · {hovered.tip} · {hovered.odds.toFixed(2)}
            </p>
            <div className="mt-1.5 flex items-center justify-between">
              <span
                className={`text-xs font-bold ${
                  hovered.status === "won" ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {hovered.status === "won" ? "✓ Won" : "✕ Lost"}
              </span>
              <span
                className={`text-xs font-bold ${
                  hovered.cumulativeProfit >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {hovered.cumulativeProfit >= 0 ? "+" : ""}
                {hovered.cumulativeProfit.toFixed(1)}u
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ROISection() {
  const [data, setData] = useState<ROIData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/roi")
      .then((r) => {
        if (!r.ok) throw new Error("failed");
        return r.json();
      })
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error) return null;

  if (!data) {
    return (
      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="skeleton mb-4 h-6 w-48 rounded" />
          <div className="mb-4 grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-14 rounded-xl" />
            ))}
          </div>
          <div className="skeleton h-[240px] rounded-xl" />
        </div>
      </section>
    );
  }

  if (data.points.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-5 py-12">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="mb-1 flex items-center gap-2">
          <h2 className="text-lg font-bold text-white">📈 Verified ROI</h2>
        </div>
        <p className="mb-5 text-sm text-slate-400">
          Cumulative profit from all settled tips — 1 unit per bet.
        </p>
        <Chart data={data} />
      </div>
    </section>
  );
}
