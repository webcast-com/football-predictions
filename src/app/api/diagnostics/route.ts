import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ROUTES = [
  { path: "/", label: "Landing", kind: "page" },
  { path: "/login", label: "Login", kind: "page" },
  { path: "/dashboard", label: "Dashboard", kind: "page" },
  { path: "/dashboard/predictions", label: "Predictions", kind: "page" },
  { path: "/dashboard/my-tips", label: "My tips", kind: "page" },
  { path: "/dashboard/premium", label: "Premium", kind: "page" },
  { path: "/api/health", label: "API · health", kind: "api" },
  { path: "/api/auth/me", label: "API · me", kind: "api" },
  { path: "/api/predictions", label: "API · predictions", kind: "api" },
  { path: "/api/stats", label: "API · stats", kind: "api" },
];

type Result = {
  path: string;
  label: string;
  kind: string;
  status: number;
  ttfb: number;
  total: number;
  bytes: number;
  ok: boolean;
};

async function sample(base: string, path: string, auth: string): Promise<Pick<Result, "status" | "ttfb" | "total" | "bytes" | "ok">> {
  const url = `${base}${path}`;
  const t0 = performance.now();
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Predikt-Diagnostics/1.0",
        ...(auth ? { Authorization: auth } : {}),
      },
      redirect: "manual",
      cache: "no-store",
    });
    const ttfb = Math.round(performance.now() - t0);
    const buf = await res.arrayBuffer();
    const total = Math.round(performance.now() - t0);
    return {
      status: res.status,
      ttfb,
      total,
      bytes: buf.byteLength,
      ok: res.status > 0 && res.status < 500,
    };
  } catch {
    const total = Math.round(performance.now() - t0);
    return { status: 0, ttfb: total, total, bytes: 0, ok: false };
  }
}

export async function GET(req: Request) {
  const user = await getCurrentUser(req.headers);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const samples = Math.max(1, Math.min(10, Number(searchParams.get("samples") || 3)));

  const base = new URL(req.url).origin;
  const auth = req.headers.get("authorization") || "";

  const started = Date.now();
  const results: Result[] = [];

  for (const r of ROUTES) {
    const runs = [];
    for (let i = 0; i < samples; i++) runs.push(await sample(base, r.path, auth));
    const totals = runs.map((x) => x.total);
    const ttfbs = runs.map((x) => x.ttfb);
    const avg = (xs: number[]) => Math.round(xs.reduce((s, n) => s + n, 0) / xs.length);
    results.push({
      path: r.path,
      label: r.label,
      kind: r.kind,
      status: runs[0].status,
      ttfb: avg(ttfbs),
      total: avg(totals),
      bytes: runs[0].bytes,
      ok: runs.every((x) => x.ok),
    });
  }

  const totalMs = Date.now() - started;
  const avgAll = Math.round(results.reduce((s, r) => s + r.total, 0) / results.length);
  return Response.json({
    base,
    samples,
    durationMs: totalMs,
    avgMs: avgAll,
    results,
  });
}
