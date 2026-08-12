/**
 * Supabase Edge Function: predictions-notify
 *
 * Invoked (fire-and-forget) by the Next.js app whenever a new VIP
 * prediction is published. Finds all users with an active premium pass
 * and fans out an alert. Wire the TODO blocks to your provider of choice
 * (Resend, Postmark, OneSignal, Expo push, web push, SMS…).
 *
 *   supabase functions deploy predictions-notify
 */
import { createClient } from "jsr:@supabase/supabase-js@2";

type Payload = {
  type: string;
  prediction?: {
    id: number;
    homeTeam: string;
    awayTeam: string;
    league: string;
    market: string;
    tip: string;
    confidence: number;
    matchDate: string;
  };
};

Deno.serve(async (req: Request) => {
  const payload = (await req.json().catch(() => ({}))) as Payload;

  if (payload.type !== "new_vip_prediction" || !payload.prediction) {
    return new Response(JSON.stringify({ error: "Unknown event type." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Users whose premium pass is still active.
  const { data: subscribers, error } = await admin
    .from("users")
    .select("id, email, name")
    .eq("plan", "premium")
    .gt("premium_until", new Date().toISOString());

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const p = payload.prediction;
  const title = `New VIP tip: ${p.homeTeam} vs ${p.awayTeam}`;
  const body = `${p.league} · ${p.market} — confidence ${p.confidence}%. Open Predikt to view the tip.`;

  for (const s of subscribers ?? []) {
    // TODO: send email / push notification to s.email here.
    console.log("notify", s.email, { title, body, predictionId: p.id });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      notified: (subscribers ?? []).length,
      predictionId: p.id,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});
