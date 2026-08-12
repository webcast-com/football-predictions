/**
 * Supabase Edge Function: predictions
 *
 * Public API for the Predikt predictions feed.
 *
 *   GET /predictions            → free (non-premium) tips for everyone
 *   GET /predictions (authorized premium user) → all tips including VIP
 *
 * Authorization: pass a valid Supabase user JWT as `Authorization: Bearer <jwt>`.
 * The function looks the user up in the app's `users` table (matched by
 * email) and unlocks VIP tips only when their premium pass is active.
 *
 * Deploy:
 *   supabase functions deploy predictions
 */
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  // ── Resolve premium status from the caller's JWT (if any) ─────────
  let premium = false;
  const auth = req.headers.get("Authorization");
  if (auth?.startsWith("Bearer ")) {
    const jwt = auth.slice(7);
    const { data } = await admin.auth.getUser(jwt);
    const email = data?.user?.email?.toLowerCase();
    if (email) {
      const { data: rows } = await admin
        .from("users")
        .select("plan, premium_until")
        .eq("email", email)
        .limit(1);
      const u = rows?.[0];
      premium =
        u?.plan === "premium" &&
        (!u.premium_until || new Date(u.premium_until) > new Date());
    }
  }

  // ── Fetch feed ─────────────────────────────────────────────────────
  const limit = Math.min(100, Number(new URL(req.url).searchParams.get("limit") || 50));
  const { data, error } = await admin
    .from("predictions")
    .select("id,home_team,away_team,league,match_date,market,tip,odds,confidence,status,is_premium")
    .order("match_date", { ascending: false })
    .limit(limit);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // Lock VIP tips for non-premium callers.
  const predictions = (data ?? []).map((p) =>
    p.is_premium && !premium
      ? { ...p, tip: "🔒 Premium tip", locked: true }
      : { ...p, locked: false }
  );

  return new Response(JSON.stringify({ premium, count: predictions.length, predictions }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
