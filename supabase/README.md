# Supabase Edge Functions

Deployable serverless functions backing the Predikt app. They run against
the same tables the Next.js app uses (`users`, `predictions`, `payments`).

## Functions

| Function | Purpose | Trigger |
| --- | --- | --- |
| `predictions` | Public HTTP API for the tips feed. Free tips for everyone; VIP tips unlocked for authorized premium users. | `GET` request |
| `predictions-notify` | Fans out an alert to all active premium subscribers when a new VIP tip is published. | Called by the Next.js app (`POST /api/predictions`) |
| `premium-watchdog` | Downgrades expired 24-hour premium passes back to `free`. | Supabase Cron (hourly) |

## Deploy

```bash
supabase link --project-ref <your-project-ref>

supabase secrets set --env-file .env.production  # optional

supabase functions deploy predictions
supabase functions deploy predictions-notify
supabase functions deploy premium-watchdog
```

## Schedule premium-watchdog (every hour)

In the Supabase dashboard: **Database → Cron Jobs → New job**:

```sql
select net.http_post(
  url := 'https://<project-ref>.supabase.co/functions/v1/premium-watchdog',
  headers := jsonb_build_object(
    'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
  )
);
```

Schedule: `0 * * * *` (hourly).

## App wiring

The Next.js app finds the functions automatically once these env vars are set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

`predictions-notify` is invoked fire-and-forget from `POST /api/predictions`
whenever a VIP tip is created; with no Supabase env vars the invoke silently
no-ops so the demo environment keeps working.
