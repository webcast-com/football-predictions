import { db } from "@/db";
import { users, payments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import {
  premiumExpiryFrom,
  PREMIUM_AMOUNT,
  PREMIUM_CURRENCY,
  PREMIUM_HOURS,
} from "@/lib/plans";

export const dynamic = "force-dynamic";

// Fallback upgrade used only when Paystack live keys are not configured,
// so the premium experience remains testable in the demo environment.
export async function POST(req: Request) {
  const user = await getCurrentUser(req.headers);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (process.env.PAYSTACK_SECRET_KEY) {
    return Response.json(
      { error: "Live Paystack is configured. Use the real checkout flow." },
      { status: 400 }
    );
  }

  // 24-hour pass — stacks on any remaining time.
  const until = premiumExpiryFrom(user.premiumUntil);

  await db
    .update(users)
    .set({ plan: "premium", premiumUntil: until })
    .where(eq(users.id, user.id));

  await db.insert(payments).values({
    userId: user.id,
    reference: `DEMO-${Date.now()}`,
    amount: PREMIUM_AMOUNT,
    currency: PREMIUM_CURRENCY,
    plan: "premium",
    status: "success",
  });

  return Response.json({ success: true, demo: true, premiumUntil: until, hours: PREMIUM_HOURS });
}
