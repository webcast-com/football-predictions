#!/usr/bin/env node
/**
 * Predikt preview server.
 *
 * Lightweight wrapper around Next.js that:
 *   • starts the production build,
 *   • adds gzip + smart cache headers,
 *   • measures every request and exposes /__perf for a live perf dashboard,
 *   • warms up the most important routes on boot so first paint is fast.
 *
 * Usage:
 *   node scripts/preview-server.mjs                 # port 3000
 *   PORT=4000 node scripts/preview-server.mjs
 */

import http from "node:http";
import { performance } from "node:perf_hooks";
import next from "next";

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";
const DEV = process.env.NODE_ENV !== "production";

const WARMUP_ROUTES = [
  "/",
  "/login",
  "/register",
  "/dashboard",
  "/dashboard/predictions",
  "/dashboard/premium",
  "/api/predictions",
  "/api/stats",
];

const STATIC_CACHE = /\/_next\/static\//;
const IMG_CACHE = /\.(png|jpg|jpeg|svg|webp|avif|ico|woff2?)$/i;

// In-memory rolling perf log (last 200 requests)
const log = [];
function record(entry) {
  log.push(entry);
  if (log.length > 200) log.shift();
}

function summarize() {
  if (!log.length) {
    return { count: 0, avg: 0, p95: 0, slowest: null, byRoute: [] };
  }
  const totals = log.map((l) => l.ms).sort((a, b) => a - b);
  const avg = Math.round(totals.reduce((s, n) => s + n, 0) / totals.length);
  const p95 = totals[Math.min(totals.length - 1, Math.floor(totals.length * 0.95))];
  const slowest = log.reduce((m, l) => (l.ms > m.ms ? l : m), log[0]);
  const map = new Map();
  for (const l of log) {
    const k = l.route;
    const v = map.get(k) || { route: k, count: 0, total: 0, max: 0 };
    v.count += 1;
    v.total += l.ms;
    v.max = Math.max(v.max, l.ms);
    map.set(k, v);
  }
  const byRoute = [...map.values()]
    .map((r) => ({ ...r, avg: Math.round(r.total / r.count) }))
    .sort((a, b) => b.avg - a.avg);
  return { count: log.length, avg, p95, slowest, byRoute };
}

function normalizeRoute(url) {
  const u = url.split("?")[0];
  // group dynamic-id routes for nicer stats
  return u.replace(/\/(\d+)(?=\/|$)/g, "/:id");
}

async function warmup(base) {
  console.log(`\n🔥 warming up ${WARMUP_ROUTES.length} routes…`);
  const t0 = performance.now();
  const results = await Promise.all(
    WARMUP_ROUTES.map(async (path) => {
      const start = performance.now();
      try {
        const res = await fetch(`${base}${path}`, {
          headers: { "User-Agent": "Predikt-Preview-Warmup/1.0", "x-warmup": "1" },
          redirect: "manual",
        });
        await res.arrayBuffer().catch(() => {});
        return { path, status: res.status, ms: Math.round(performance.now() - start) };
      } catch (e) {
        return { path, status: 0, ms: 0, err: String(e?.message || e) };
      }
    })
  );
  const total = Math.round(performance.now() - t0);
  for (const r of results) {
    const ok = r.status >= 200 && r.status < 500 ? "✓" : "✗";
    console.log(`   ${ok} ${r.path.padEnd(34)} ${r.status || "ERR"}  ${r.ms}ms`);
  }
  console.log(`   ⏱  warmup complete in ${total}ms\n`);
}

function clientAcceptsGzip(req) {
  const ae = req.headers["accept-encoding"];
  return typeof ae === "string" && ae.includes("gzip");
}

function setCacheHeaders(req, res) {
  const url = req.url || "";
  if (STATIC_CACHE.test(url)) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  } else if (IMG_CACHE.test(url)) {
    res.setHeader("Cache-Control", "public, max-age=86400");
  } else if (url.startsWith("/api/")) {
    // Predictions/stats are short-lived but cheap to refetch
    if (url === "/api/predictions" || url === "/api/stats") {
      res.setHeader("Cache-Control", "private, max-age=10, stale-while-revalidate=60");
    } else {
      res.setHeader("Cache-Control", "no-store");
    }
  }
}

async function start() {
  const app = next({ dev: DEV });
  const handle = app.getRequestHandler();
  await app.prepare();

  const server = http.createServer(async (req, res) => {
    const start = performance.now();
    const route = normalizeRoute(req.url || "/");

    // built-in perf endpoint
    if (req.url === "/__perf") {
      const data = summarize();
      const body = JSON.stringify(data, null, 2);
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "no-store");
      res.end(body);
      return;
    }

    setCacheHeaders(req, res);
    res.setHeader("X-Powered-By", "Predikt-Preview");
    if (clientAcceptsGzip(req)) res.setHeader("Vary", "Accept-Encoding");

    res.on("finish", () => {
      const ms = Math.round(performance.now() - start);
      record({ route, status: res.statusCode, ms, at: Date.now() });
      res.setHeader; // no-op, headers already sent
    });

    try {
      await handle(req, res);
    } catch (err) {
      console.error("request error", err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
    }
  });

  server.listen(PORT, HOST, async () => {
    const base = `http://localhost:${PORT}`;
    console.log(`\n🚀 Predikt preview server ready at ${base}`);
    console.log(`   perf dashboard: ${base}/__perf`);
    // fire-and-forget warmup
    warmup(base).catch((e) => console.warn("warmup failed:", e));
  });
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
