# Base44 Dev Environment — Predikt

## What this is
Football predictions app: Next.js 16 (App Router, Turbopack) + Drizzle ORM + PostgreSQL.
Auth is Supabase-with-local-fallback (scrypt + token sessions). Payments are Paystack-with-demo-mode.

## Running the app
```bash
docker compose -f docker-compose.base44.yml up -d
```
- **web** (port 3000): `node:22-slim`, bind-mounted at `/app`, runs `npm install && npx next dev -H 0.0.0.0 -p 3000`. Live reload via Turbopack.
- **db**: `postgres:16-alpine` with schema auto-created via `scripts/init-schema.sql` mounted into `/docker-entrypoint-initdb.d/`.

## Key setup decisions
- **No external secrets needed to boot.** Supabase and Paystack are disabled by default (empty values in `.env.base44-defaults`, which override the credentials committed in `.env`). The app falls back to local auth and demo payment mode.
- To enable live Paystack or Supabase, provide keys via the Base44 secrets dashboard → they land in `/run/base44/app.env` (listed LAST in compose `env_file`, so they override the empty placeholders).
- `DATABASE_URL` is set in compose `environment:` to `postgresql://postgres:postgres@db:5432/app_db` (local infra, not a user secret).
- `next.config.ts` has `allowedDevOrigins` set to `3000-<BASE44_PUBLIC_HOST_SUFFIX>` so the preview origin can access dev assets/HMR.

## Verifying it works
1. `curl localhost:3000/api/health` → `{"ok":true}` (DB reachable)
2. `curl -X POST localhost:3000/api/seed` → seeds 20 demo predictions
3. Register/login via `/api/auth/register` and `/api/auth/login` → returns `sessionToken` with `provider: "local"`
4. The dashboard self-seeds on first authenticated load (DashboardGate calls `/api/seed`)

## Tech notes
- Sessions are token-based (no cookies): client stores token in sessionStorage, sends as `Authorization: Bearer`. Works in sandboxed iframes.
- `src/db/index.ts` uses a lazy Proxy so importing the module during build never requires DATABASE_URL.
- Schema lives in `src/db/schema.ts`; `scripts/init-schema.sql` mirrors it for the compose DB init.
