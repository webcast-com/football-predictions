import { db } from "@/db";
import { users, predictions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { hashPassword } from "@/lib/auth";

function daysFromNow(d: number, hour = 18) {
  const date = new Date();
  date.setDate(date.getDate() + d);
  date.setHours(hour, 0, 0, 0);
  return date;
}

const HISTORY_MARKER = { homeTeam: "Ajax", awayTeam: "Feyenoord" };

async function ensureHistorySeed(authorId: number): Promise<number> {
  const marker = await db
    .select()
    .from(predictions)
    .where(
      and(
        eq(predictions.homeTeam, HISTORY_MARKER.homeTeam),
        eq(predictions.awayTeam, HISTORY_MARKER.awayTeam)
      )
    )
    .limit(1);
  if (marker.length > 0) return 0;

  const history = [
    { homeTeam: "Ajax", awayTeam: "Feyenoord", league: "Eredivisie", matchDate: daysFromNow(-28, 18), market: "1X2", tip: "Home Win", odds: 1.95, confidence: 76, status: "won", isPremium: false, analysis: "Ajax dominant at home in De Klassieker." },
    { homeTeam: "Real Madrid", awayTeam: "Sevilla", league: "La Liga", matchDate: daysFromNow(-26, 20), market: "Over/Under 2.5", tip: "Over 2.5 Goals", odds: 1.80, confidence: 74, status: "lost", isPremium: true, analysis: "Both sides in scoring form going into the clash." },
    { homeTeam: "Inter Milan", awayTeam: "Roma", league: "Serie A", matchDate: daysFromNow(-24, 19), market: "BTTS", tip: "Both Teams to Score", odds: 1.70, confidence: 71, status: "lost", isPremium: true, analysis: "Roma's away attack should breach Inter at least once." },
    { homeTeam: "Liverpool", awayTeam: "Everton", league: "Premier League", matchDate: daysFromNow(-22, 17), market: "1X2", tip: "Home Win", odds: 1.55, confidence: 86, status: "won", isPremium: false, analysis: "Merseyside derby form strongly favors Liverpool at Anfield." },
    { homeTeam: "Bayern Munich", awayTeam: "RB Leipzig", league: "Bundesliga", matchDate: daysFromNow(-20, 18), market: "Over/Under 2.5", tip: "Over 2.5 Goals", odds: 1.62, confidence: 79, status: "won", isPremium: true, analysis: "These meetings average 3.8 goals over the last 5 years." },
    { homeTeam: "PSG", awayTeam: "Lyon", league: "Ligue 1", matchDate: daysFromNow(-18, 20), market: "1X2", tip: "Home Win", odds: 1.52, confidence: 82, status: "won", isPremium: true, analysis: "PSG's home record against Lyon is outstanding." },
    { homeTeam: "Chelsea", awayTeam: "Tottenham", league: "Premier League", matchDate: daysFromNow(-16, 19), market: "BTTS", tip: "Both Teams to Score", odds: 1.70, confidence: 68, status: "won", isPremium: false, analysis: "London derbies between these two rarely lack goals." },
    { homeTeam: "Barcelona", awayTeam: "Real Sociedad", league: "La Liga", matchDate: daysFromNow(-14, 21), market: "1X2", tip: "Home Win", odds: 1.50, confidence: 84, status: "won", isPremium: false, analysis: "Barça unbeaten in their last 10 home games." },
    { homeTeam: "Atletico Madrid", awayTeam: "Villarreal", league: "La Liga", matchDate: daysFromNow(-12, 18), market: "Under/Over 2.5", tip: "Under 2.5 Goals", odds: 1.85, confidence: 72, status: "won", isPremium: true, analysis: "Simeone's sides grind out low-scoring wins." },
    { homeTeam: "Dortmund", awayTeam: "Bayer Leverkusen", league: "Bundesliga", matchDate: daysFromNow(-10, 19), market: "1X2", tip: "Home Win", odds: 2.10, confidence: 63, status: "lost", isPremium: false, analysis: "Westfalenstadion factor gives Dortmund the edge." },
  ];

  await db.insert(predictions).values(history.map((s) => ({ ...s, userId: authorId })));
  return history.length;
}

export async function ensureSeed(): Promise<{ seeded: boolean; count: number }> {
  let author = (
    await db.select().from(users).where(eq(users.email, "experts@predikt.app")).limit(1)
  )[0];

  if (!author) {
    [author] = await db
      .insert(users)
      .values({
        name: "Predikt Experts",
        email: "experts@predikt.app",
        passwordHash: hashPassword("demo-experts-" + Math.random()),
        role: "admin",
        plan: "premium",
        premiumUntil: daysFromNow(3650),
      })
      .returning();
  }

  const existing = await db.select().from(predictions);
  if (existing.length > 0) {
    // Base data exists — still top up the settled history set once.
    await ensureHistorySeed(author.id);
    return { seeded: false, count: existing.length };
  }

  const seed = [
    { homeTeam: "Arsenal", awayTeam: "Chelsea", league: "Premier League", matchDate: daysFromNow(1, 17), market: "1X2", tip: "Home Win", odds: 1.85, confidence: 78, status: "pending", isPremium: false, analysis: "Arsenal unbeaten in their last 6 home games and Chelsea struggle on the road." },
    { homeTeam: "Barcelona", awayTeam: "Real Madrid", league: "La Liga", matchDate: daysFromNow(2, 20), market: "Over/Under 2.5", tip: "Over 2.5 Goals", odds: 1.72, confidence: 84, status: "pending", isPremium: true, analysis: "El Clásico has produced 3+ goals in 7 of the last 9 meetings." },
    { homeTeam: "Bayern Munich", awayTeam: "Dortmund", league: "Bundesliga", matchDate: daysFromNow(3, 18), market: "BTTS", tip: "Both Teams to Score", odds: 1.55, confidence: 81, status: "pending", isPremium: true, analysis: "Der Klassiker rarely ends without both sides finding the net." },
    { homeTeam: "Inter Milan", awayTeam: "Juventus", league: "Serie A", matchDate: daysFromNow(4, 19), market: "1X2", tip: "Draw or Inter", odds: 1.40, confidence: 73, status: "pending", isPremium: false, analysis: "Inter's solid defense should at least secure a point at home." },
    { homeTeam: "Man City", awayTeam: "Liverpool", league: "Premier League", matchDate: daysFromNow(-2, 16), market: "Over/Under 2.5", tip: "Over 2.5 Goals", odds: 1.66, confidence: 88, status: "won", isPremium: true, analysis: "Two attacking juggernauts — goals are almost guaranteed." },
    { homeTeam: "PSG", awayTeam: "Marseille", league: "Ligue 1", matchDate: daysFromNow(-3, 20), market: "1X2", tip: "Home Win", odds: 1.50, confidence: 85, status: "won", isPremium: false, analysis: "Le Classique at home — PSG firepower too strong." },
    { homeTeam: "Tottenham", awayTeam: "Newcastle", league: "Premier League", matchDate: daysFromNow(-1, 15), market: "BTTS", tip: "Both Teams to Score", odds: 1.60, confidence: 76, status: "lost", isPremium: false, analysis: "Both teams have leaky defenses this season." },
    { homeTeam: "Atletico Madrid", awayTeam: "Sevilla", league: "La Liga", matchDate: daysFromNow(-4, 21), market: "Over/Under 2.5", tip: "Under 2.5 Goals", odds: 1.90, confidence: 70, status: "won", isPremium: true, analysis: "Atletico's disciplined defense keeps games tight at the Metropolitano." },
    { homeTeam: "AC Milan", awayTeam: "Napoli", league: "Serie A", matchDate: daysFromNow(5, 19), market: "Double Chance", tip: "Milan or Draw", odds: 1.45, confidence: 79, status: "pending", isPremium: false, analysis: "San Siro form makes Milan tough to beat against Napoli." },
    { homeTeam: "Man United", awayTeam: "Aston Villa", league: "Premier League", matchDate: daysFromNow(6, 17), market: "Correct Score", tip: "2-1 Home", odds: 7.50, confidence: 55, status: "pending", isPremium: true, analysis: "United tend to win tight home games by a single goal margin." },
  ];

  await db.insert(predictions).values(seed.map((s) => ({ ...s, userId: author.id })));
  await ensureHistorySeed(author.id);
  return { seeded: true, count: seed.length };
}
