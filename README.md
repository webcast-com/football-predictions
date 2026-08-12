<div align="center">

# ⚽ Predikt — Football Predictions

Data-driven football predictions with free daily tips and premium VIP picks.
Unlock everything for **24 hours with KES 100** via Paystack — no recurring subscriptions.

Built with **Next.js 16 (App Router) · Drizzle ORM · PostgreSQL/Supabase · Tailwind CSS 4 · Paystack**

</div>

---

## ✨ Features

### For users
- **Free plan (KES 0)** — daily free tips, live stats dashboard, win-rate history, create & track personal tips
- **Premium 24-hour pass (KES 100)** — unlocks every VIP pick for exactly 24 hours; buying again **stacks +24h**; no auto-renewals
- **Prediction history** — settled results with win rate, profit in units, ROI and recent-form streak
- **Personal tips** — full CRUD with confidence slider, markets (1X2, BTTS, O/U 2.5, etc.), optimistic updates
- **Premium gating** — VIP tips are server-side locked for free users, with upgrade prompts
- **Countdown UI** — progress bar of remaining premium time, stacking "Add +24h" checkout

### For developers
- **Auth** — Supabase Auth when configured, with automatic fallback to built-in scrypt-hashed Postgres auth. Sessions use a CHIPS `Partitioned` cookie plus a token fallback (`Authorization: Bearer` via sessionStorage) so login also works inside embedded previews that block third-party cookies
- **Payments** — Paystack live API: hosted checkout, callback verification, and a **HMAC-SHA512 verified webhook**
- **Supabase Edge Functions** — deployable `predictions` API, `predictions-notify`, and `premium-watchdog` (expiry cron)
- **SEO** — sitemap.xml, robots.txt, Open Graph image (via `next/og`), Twitter cards, canonicals
- **Perf tooling** — warmup script, CLI load tester, custom auto-warming preview server with `__perf` stats, in-app diagnostics page
- **Public pages** — About, Privacy policy, Cookie policy, Contact (working form → database)

---

## 🧱 Tech stack

| Layer | Tech |
| --- | --- |
| Framework | Next.js 16 App Router (React 19, Turbopack) |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL via Drizzle ORM (works with local PG or Supabase) |
| Auth | Supabase Auth **or** built-in scrypt + session cookies (auto-fallback) |
| Payments | Paystack live API (`transaction/initialize`, `/verify`, signed webhook) |
| Serverless | Supabase Edge Functions (Deno) |
| Type safety | TypeScript strict + `next typegen` |

---

## 🚀 Getting started

### 1. Install & configure

```bash
npm install
cp .env.example .env.local    # then edit values
```

### 2. Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Postgres connection string. Local dev or Supabase (`postgres://postgres:[pw]@db.[ref].supabase.co:5432/postgres` — SSL auto-enabled) |
| `PAYSTACK_SECRET_KEY` | optional | Enables **live** payments + webhook verification. Without it, checkout runs in a safe built-in demo mode |
| `NEXT_PUBLIC_SUPABASE_URL` | optional | Supabase project URL — activates Supabase Auth + Edge Function calls |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | optional | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | optional | Supabase service role (server-only) |
| `NEXT_PUBLIC_SITE_URL` | optional | Canonical domain used in sitemap/OG tags |

### 3. Database

```bash
npx drizzle-kit push --force   # create tables
npm run build && npm start     # then:
curl -X POST http://localhost:3000/api/seed   # demo predictions + history (idempotent)
```

The dashboard also self-seeds on first authenticated load — so first run already feels alive (20 tips, settled history, form streaks).

### 4. Run

```bash
npm run dev                    # dev server
npm run build && npm start     # production
```

---

## 💳 Subscription model (confirmed)

| Plan | Price | Access |
| --- | --- | --- |
| **Free** | KES 0 forever | Daily free tips, stats, personal tips, VIP picks locked |
| **Premium pass** | **KES 100 / 24 hours** | All VIP picks unlocked for 24h. Re-purchase stacks +24h on remaining time. Auto-expires back to Free — no recurring charges |

Premium activation has **three independent paths**:
1. **Callback verify** — `GET /dashboard/premium?verify=1&reference=…` checks the transaction server-side
2. **Webhook** — `POST /api/paystack/webhook` (signature-verified) activates even if the user never returns
3. **Demo mode** — automatic when no Paystack key is set (for sandbox testing)

---

## 📡 API routes

| Route | Description |
| --- | --- |
| `POST /api/auth/register` · `login` · `logout` | Auth (Supabase-aware, local fallback) |
| `GET /api/auth/me` | Current user, plan, hours left, provider |
| `GET/POST /api/predictions` | Feed (VIP locked for free users) / create tip |
| `PUT/DELETE /api/predictions/[id]` | Owner-only update/delete |
| `GET /api/stats` | Win rate, totals, avg winning odds |
| `POST /api/paystack/initialize` | Start KES 100 M-Pesa/card checkout |
| `GET /api/paystack/verify?reference=` | Verify payment → grant 24h (stacking) |
| `POST /api/paystack/webhook` | Signature-verified `charge.success` handler |
| `POST /api/paystack/demo-upgrade` | Demo-mode 24h pass (only without keys) |
| `POST /api/contact` | Contact form → `contact_messages` |
| `GET /api/diagnostics` | In-app perf tester (samples every route) |
| `POST /api/seed` · `GET /api/health` | Seed demo data · DB health |

## ⚡ Supabase Edge Functions (`supabase/functions/`)

| Function | Trigger | Purpose |
| --- | --- | --- |
| `predictions` | HTTP GET | Public feed API — free tips for all, VIP unlocked for premium bearer JWTs |
| `predictions-notify` | App fire-and-forget | Alerts active premium subscribers on new VIP tips |
| `premium-watchdog` | Supabase Cron (hourly) | Expires elapsed 24h passes back to Free |

Deploy: `supabase functions deploy <name>` — full guide in [`supabase/README.md`](supabase/README.md).

---

## 🛠 Performance tooling

```bash
node scripts/perf-test.mjs --samples=10 --concurrency=8   # TTFB/total/size per route, p95 stats
node scripts/warmup.mjs --watch --interval=60             # keep the route cache hot
node scripts/preview-server.mjs                           # next start + cache headers + warmup + /__perf
```

Plus an in-app **Diagnostics** page (sidebar) to warm routes and run perf tests from the browser.

## 📂 Project structure

```
src/
├── app/
│   ├── page.tsx (landing)  · about · privacy · cookies · contact
│   ├── sitemap.ts · robots.ts · opengraph-image.tsx
│   ├── login · register
│   ├── dashboard/ (overview · predictions · history · my-tips · premium · diagnostics · settings)
│   └── api/ (auth · predictions · stats · paystack · contact · seed · diagnostics · health)
├── components/ (Sidebar, prediction cards/modal, contact form, public shell)
├── db/ (schema · connection)
└── lib/ (auth · plans · seed · supabase)
scripts/ (perf-test · warmup · preview-server)
supabase/ (Edge Functions + README)
```

## 🌍 Deployment

1. Point `DATABASE_URL` at your production Postgres/Supabase instance (SSL handled automatically).
2. Set `PAYSTACK_SECRET_KEY` (live key) and configure the webhook URL `https://<domain>/api/paystack/webhook` in the Paystack dashboard.
3. Set `NEXT_PUBLIC_SITE_URL` for correct sitemap/OG URLs.
4. Optional: set the three Supabase vars and deploy the Edge Functions.

---

<div align="center">
18+ only. Predictions are insights, not guarantees — bet responsibly.
</div>
