#!/usr/bin/env node
/**
 * Predikt page load tester.
 *
 * Measures TTFB, total response time, payload size and status for every
 * route. Supports repeated samples and basic concurrency so you can stress
 * test the preview server.
 *
 * Usage:
 *   node scripts/perf-test.mjs                       # 5 samples per route, concurrency 4
 *   node scripts/perf-test.mjs --samples=10 --concurrency=8
 *   node scripts/perf-test.mjs --base=http://localhost:3000 --json
 */

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);

const BASE = (args.base || process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const SAMPLES = Number(args.samples || 5);
const CONCURRENCY = Number(args.concurrency || 4);
const AS_JSON = Boolean(args.json);

const ROUTES = [
  { path: "/", label: "Landing" },
  { path: "/login", label: "Login" },
  { path: "/register", label: "Register" },
  { path: "/dashboard", label: "Dashboard" },
  { path: "/dashboard/predictions", label: "Predictions feed" },
  { path: "/dashboard/my-tips", label: "My tips" },
  { path: "/dashboard/premium", label: "Premium" },
  { path: "/api/health", label: "API health" },
  { path: "/api/predictions", label: "API predictions" },
  { path: "/api/stats", label: "API stats" },
];

const c = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

async function sample(path) {
  const url = `${BASE}${path}`;
  const t0 = performance.now();
  let ttfb = 0;
  let bytes = 0;
  let status = 0;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Predikt-PerfTest/1.0" },
      redirect: "manual",
    });
    ttfb = Math.round(performance.now() - t0);
    status = res.status;
    const buf = await res.arrayBuffer();
    bytes = buf.byteLength;
  } catch {
    status = 0;
  }
  const total = Math.round(performance.now() - t0);
  return { path, status, ttfb, total, bytes };
}

async function pool(tasks, concurrency) {
  const out = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, tasks.length) }, async () => {
      while (i < tasks.length) {
        const idx = i++;
        out[idx] = await tasks[idx]();
      }
    })
  );
  return out;
}

function stats(nums) {
  if (!nums.length) return { min: 0, max: 0, avg: 0, p95: 0 };
  const sorted = [...nums].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const avg = Math.round(sorted.reduce((s, n) => s + n, 0) / sorted.length);
  const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
  return { min, max, avg, p95 };
}

function fmt(ms) {
  if (ms < 200) return c.green(`${ms}ms`);
  if (ms < 600) return c.yellow(`${ms}ms`);
  return c.red(`${ms}ms`);
}

function fmtBytes(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

async function main() {
  if (!AS_JSON) {
    console.log(c.bold(`\nPredikt perf test`));
    console.log(c.dim(`base ${BASE} · ${SAMPLES} samples · concurrency ${CONCURRENCY}\n`));
  }

  const tasks = [];
  for (const r of ROUTES) {
    for (let i = 0; i < SAMPLES; i++) tasks.push(() => sample(r.path));
  }
  const all = await pool(tasks, CONCURRENCY);

  const byPath = {};
  for (const r of all) {
    (byPath[r.path] ??= []).push(r);
  }

  const report = ROUTES.map((r) => {
    const rows = byPath[r.path] || [];
    const totals = rows.map((x) => x.total);
    const ttfbs = rows.map((x) => x.ttfb);
    const okCount = rows.filter((x) => x.status > 0 && x.status < 500).length;
    return {
      path: r.path,
      label: r.label,
      ok: okCount,
      samples: rows.length,
      status: rows[0]?.status ?? 0,
      bytes: rows[0]?.bytes ?? 0,
      total: stats(totals),
      ttfb: stats(ttfbs),
    };
  });

  if (AS_JSON) {
    console.log(JSON.stringify({ base: BASE, samples: SAMPLES, report }, null, 2));
    return;
  }

  const w = Math.max(...report.map((r) => r.label.length));
  console.log(
    c.bold(
      `  ${"Route".padEnd(w)}  Status   Size       TTFB (avg/p95)        Total (avg/p95)`
    )
  );
  console.log(c.dim(`  ${"-".repeat(w + 70)}`));
  for (const r of report) {
    const statusStr = r.status >= 200 && r.status < 400 ? c.green(r.status) : c.red(r.status || "ERR");
    console.log(
      `  ${r.label.padEnd(w)}  ${String(statusStr).padEnd(15)}  ${fmtBytes(r.bytes).padEnd(9)}  ${fmt(r.ttfb.avg)} / ${fmt(r.ttfb.p95)}     ${fmt(r.total.avg)} / ${fmt(r.total.p95)}`
    );
  }

  const allTotals = all.map((x) => x.total);
  const s = stats(allTotals);
  console.log("");
  console.log(
    c.bold(`Summary: `) +
      `min ${fmt(s.min)} · avg ${fmt(s.avg)} · p95 ${fmt(s.p95)} · max ${fmt(s.max)} · ${all.length} requests`
  );

  const slow = report.filter((r) => r.total.avg > 800);
  if (slow.length) {
    console.log(c.yellow(`\n⚠ Slow routes (>800ms avg):`));
    for (const r of slow) console.log(`  · ${r.label} (${fmt(r.total.avg)})`);
  } else {
    console.log(c.green(`\n✓ All routes under 800ms average. Looking good.`));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
