import { db } from "@/db";
import { predictions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getCurrentUser(req.headers);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const all = await db.select().from(predictions);
  const settled = all.filter((p) => p.status !== "pending");
  const won = all.filter((p) => p.status === "won");
  const lost = all.filter((p) => p.status === "lost");
  const pending = all.filter((p) => p.status === "pending");

  const winRate = settled.length
    ? Math.round((won.length / settled.length) * 100)
    : 0;

  const mine = all.filter((p) => p.userId === user.id);

  const avgOdds = won.length
    ? won.reduce((s, p) => s + p.odds, 0) / won.length
    : 0;

  return Response.json(
    {
      total: all.length,
      won: won.length,
      lost: lost.length,
      pending: pending.length,
      winRate,
      avgOdds: Number(avgOdds.toFixed(2)),
      mine: mine.length,
      premiumCount: all.filter((p) => p.isPremium).length,
    },
    {
      headers: {
        "Cache-Control": "private, max-age=15, stale-while-revalidate=120",
      },
    }
  );
}
