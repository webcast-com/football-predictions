#!/usr/bin/env node
/**
 * Predikt warmup server / cache primer.
 *
 * Hits a list of routes against a running Next.js server to fill its
 * route + data cache, so the first real user request is already warm.
 *
 * Usage:
 *   node scripts/warmup.mjs                       # warm http://localhost:3000 once
 *   node scripts/warmup.mjs --watch --interval=60 # keep warming every 60s
 *   BASE_URL=https://my-app node scripts/warmup.mjs
 */

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);

const BASE = (args.base || process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const WATCH = Boolean(args.watch);
const INTERVAL = Number(args.interval || 60) * 1000;

const ROUTES = [
  "/",
  "/login",
  "/register",
  "/dashboard",
  "/dashboard/predictions",
  "/dashboard/my-tips",
  "/dashboard/premium",
  "/dashboard/settings",
  "/api/health",
  "/api/auth/me",
  "/api/predictions",
  "/api/stats",
];

const color = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

async function fetchOne(path) {
  const url = `${BASE}${path}`;
  const start = performance.now();
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Predikt-Warmup/1.0", "x-warmup": "1" },
      redirect: "manual",
    });
    // drain body so HTTP keep-alive can be reused and Next finishes rendering
    await res.arrayBuffer().catch(() => {});
    const ms = Math.round(performance.now() - start);
    return { path, status: res.status, ms, ok: res.status < 500 };
  } catch (e) {
    return { path, status: 0, ms: Math.round(performance.now() - start), ok: false, err: String(e?.message || e) };
  }
}

function fmtMs(ms) {
  if (ms < 200) return color.green(`${ms}ms`);
  if (ms < 600) return color.yellow(`${ms}ms`);
  return color.red(`${ms}ms`);
}

async function runOnce(pass) {
  const label = pass ? `pass #${pass}` : "warmup";
  console.log(color.bold(`\n→ ${label} against ${BASE}`));
  const t0 = performance.now();
  const results = await Promise.all(ROUTES.map(fetchOne));
  const total = Math.round(performance.now() - t0);

  const widest = Math.max(...results.map((r) => r.path.length));
  for (const r of results) {
    const status = r.ok ? color.green(String(r.status || "-")) : color.red(String(r.status || "ERR"));
    console.log(`  ${r.path.padEnd(widest)}  ${status}  ${fmtMs(r.ms)}${r.err ? "  " + color.dim(r.err) : ""}`);
  }
  const ok = results.filter((r) => r.ok).length;
  const slowest = results.reduce((m, r) => (r.ms > m.ms ? r : m), results[0]);
  console.log(
    color.dim(
      `  ⏱  ${ok}/${results.length} ok · total ${total}ms · slowest ${slowest.path} (${slowest.ms}ms)`
    )
  );
  return results;
}

async function main() {
  if (!WATCH) {
    await runOnce();
    return;
  }
  let n = 0;
  for (;;) {
    n += 1;
    await runOnce(n);
    await new Promise((r) => setTimeout(r, INTERVAL));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
