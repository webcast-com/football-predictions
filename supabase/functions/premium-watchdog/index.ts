/**
 * Supabase Edge Function: premium-watchdog
 *
 * Expires 24-hour premium passes: downgrades every user whose
 * premium_until has passed from 'premium' back to 'free'.
 *
 * Run periodically with a Supabase Scheduled invocation / pg_cron, e.g.
 * every hour:
 *
 *   supabase functions deploy premium-watchdog
 *   # then add a schedule in the Supabase dashboard:
 *   #   Database → Cron Jobs → "0 * * * *" → call this function
 */
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async () => {
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data, error } = await admin
    .from("users")
    .update({ plan: "free", premium_until: null })
    .eq("plan", "premium")
    .lt("premium_until", new Date().toISOString())
    .select("id");

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, expired: (data ?? []).length }), {
    headers: { "Content-Type": "application/json" },
  });
});
