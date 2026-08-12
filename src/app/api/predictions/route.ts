import { db } from "@/db";
import { predictions } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getCurrentUser, isPremiumActive } from "@/lib/auth";
import { invokeSupabaseFunction } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET: list predictions. ?scope=mine returns only the user's own.
export async function GET(req: Request) {
  const user = await getCurrentUser(req.headers);
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope");
  const premium = isPremiumActive(user);

  let rows;
  if (scope === "mine") {
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    rows = await db
      .select()
      .from(predictions)
      .where(eq(predictions.userId, user.id))
      .orderBy(desc(predictions.matchDate));
  } else {
    rows = await db
      .select()
      .from(predictions)
      .orderBy(desc(predictions.matchDate));
  }

  // Lock premium predictions for non-premium users (unless they own them)
  const result = rows.map((r) => {
    const owned = user && r.userId === user.id;
    if (r.isPremium && !premium && !owned) {
      return {
        ...r,
        locked: true,
        tip: "🔒 Premium tip",
        analysis: "",
      };
    }
    return { ...r, locked: false };
  });

  return Response.json(
    { predictions: result, premium },
    {
      headers: {
        "Cache-Control": "private, max-age=10, stale-while-revalidate=60",
      },
    }
  );
}

// POST: create a prediction
export async function POST(req: Request) {
  const user = await getCurrentUser(req.headers);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const {
      homeTeam,
      awayTeam,
      league,
      matchDate,
      market,
      tip,
      odds,
      confidence,
      status,
      isPremium,
      analysis,
    } = body;
    if (!homeTeam || !awayTeam || !league || !matchDate || !market || !tip) {
      return Response.json({ error: "Missing required fields." }, { status: 400 });
    }
    const [created] = await db
      .insert(predictions)
      .values({
        userId: user.id,
        homeTeam: String(homeTeam).trim(),
        awayTeam: String(awayTeam).trim(),
        league: String(league).trim(),
        matchDate: new Date(matchDate),
        market: String(market).trim(),
        tip: String(tip).trim(),
        odds: Number(odds) || 1.5,
        confidence: Math.max(0, Math.min(100, Number(confidence) || 70)),
        status: status || "pending",
        isPremium: Boolean(isPremium),
        analysis: analysis ? String(analysis) : "",
      })
      .returning();

    // Fire-and-forget: notify premium subscribers via the Supabase Edge
    // Function whenever a new VIP tip is published (no-op without Supabase).
    if (created.isPremium) {
      void invokeSupabaseFunction("predictions-notify", {
        type: "new_vip_prediction",
        prediction: {
          id: created.id,
          homeTeam: created.homeTeam,
          awayTeam: created.awayTeam,
          league: created.league,
          market: created.market,
          tip: created.tip,
          confidence: created.confidence,
          matchDate: created.matchDate,
        },
      }).catch(() => {});
    }

    return Response.json({ prediction: created });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to create prediction." }, { status: 500 });
  }
}
