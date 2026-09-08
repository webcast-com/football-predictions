import { db } from "@/db";
import { predictions } from "@/db/schema";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * Public ROI data — no auth required.
 * Returns settled predictions (won/lost) with cumulative profit in units,
 * plus summary stats. Cached for 5 minutes since it only changes when
 * predictions are settled.
 *
 * Profit per tip: won = +(odds - 1), lost = -1, pending = excluded.
 */
export async function GET() {
  // Fetch all predictions ordered by date, then filter to settled in JS.
  // (Keeps the query simple and avoids importing additional drizzle operators.)
  const settled = await db
    .select({
      id: predictions.id,
      homeTeam: predictions.homeTeam,
      awayTeam: predictions.awayTeam,
      league: predictions.league,
      matchDate: predictions.matchDate,
      market: predictions.market,
      tip: predictions.tip,
      odds: predictions.odds,
      status: predictions.status,
    })
    .from(predictions)
    .orderBy(asc(predictions.matchDate));

  const rows = settled.filter((r) => r.status === "won" || r.status === "lost");

  let cumulative = 0;
  const points = rows.map((r) => {
    const profit = r.status === "won" ? r.odds - 1 : -1;
    cumulative += profit;
    return {
      date: r.matchDate.toISOString(),
      cumulativeProfit: Math.round(cumulative * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      homeTeam: r.homeTeam,
      awayTeam: r.awayTeam,
      league: r.league,
      market: r.market,
      tip: r.tip,
      odds: r.odds,
      status: r.status,
    };
  });

  const wonCount = rows.filter((r) => r.status === "won").length;
  const totalStaked = rows.length; // 1 unit per bet
  const totalProfit = Math.round(cumulative * 100) / 100;
  const roi = totalStaked > 0 ? Math.round((totalProfit / totalStaked) * 1000) / 10 : 0;
  const winRate = rows.length > 0 ? Math.round((wonCount / rows.length) * 100) : 0;

  return Response.json(
    {
      points,
      summary: {
        totalProfit,
        roi,
        tipsCount: rows.length,
        wonCount,
        winRate,
      },
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      },
    }
  );
}
