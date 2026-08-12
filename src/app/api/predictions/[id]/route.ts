import { db } from "@/db";
import { predictions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const predictionId = Number(id);
  try {
    const body = await req.json();
    const existing = await db
      .select()
      .from(predictions)
      .where(and(eq(predictions.id, predictionId), eq(predictions.userId, user.id)))
      .limit(1);
    if (existing.length === 0) {
      return Response.json({ error: "Not found." }, { status: 404 });
    }
    const [updated] = await db
      .update(predictions)
      .set({
        homeTeam: String(body.homeTeam).trim(),
        awayTeam: String(body.awayTeam).trim(),
        league: String(body.league).trim(),
        matchDate: new Date(body.matchDate),
        market: String(body.market).trim(),
        tip: String(body.tip).trim(),
        odds: Number(body.odds) || 1.5,
        confidence: Math.max(0, Math.min(100, Number(body.confidence) || 70)),
        status: body.status || "pending",
        isPremium: Boolean(body.isPremium),
        analysis: body.analysis ? String(body.analysis) : "",
        updatedAt: new Date(),
      })
      .where(eq(predictions.id, predictionId))
      .returning();
    return Response.json({ prediction: updated });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to update prediction." }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const predictionId = Number(id);
  const deleted = await db
    .delete(predictions)
    .where(and(eq(predictions.id, predictionId), eq(predictions.userId, user.id)))
    .returning();
  if (deleted.length === 0) {
    return Response.json({ error: "Not found." }, { status: 404 });
  }
  return Response.json({ ok: true });
}
