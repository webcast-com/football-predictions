import { createHmac } from "crypto";
import { db } from "@/db";
import { payments, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { premiumExpiryFrom } from "@/lib/plans";

export const dynamic = "force-dynamic";

/**
 * Paystack webhook endpoint.
 *
 * Configure in your Paystack dashboard → Settings → Webhooks:
 *   URL: https://your-domain/api/paystack/webhook
 *
 * Every request is verified against the HMAC-SHA512 signature of the raw
 * body using PAYSTACK_SECRET_KEY before anything is trusted. On
 * `charge.success` the matching payment is marked successful and the user
 * is granted a stacked 24-hour premium pass — so premium activates even if
 * the customer never returns to the site after checkout.
 */
export async function POST(req: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return Response.json({ error: "Paystack is not configured." }, { status: 503 });
  }

  const raw = await req.text();
  const signature = req.headers.get("x-paystack-signature") || "";
  const expected = createHmac("sha512", secret).update(raw).digest("hex");

  if (!signature || expected !== signature) {
    return Response.json({ error: "Invalid signature." }, { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Invalid payload." }, { status: 400 });
  }

  if (event.event === "charge.success" && event.data?.reference) {
    const reference = event.data.reference;
    try {
      const rows = await db
        .select()
        .from(payments)
        .where(eq(payments.reference, reference))
        .limit(1);
      const payment = rows[0];

      if (payment && payment.status !== "success") {
        await db
          .update(payments)
          .set({ status: "success" })
          .where(eq(payments.reference, reference));

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, payment.userId))
          .limit(1);

        if (user) {
          const until = premiumExpiryFrom(user.premiumUntil);
          await db
            .update(users)
            .set({ plan: "premium", premiumUntil: until })
            .where(eq(users.id, user.id));
        }
      }
    } catch (e) {
      console.error("paystack webhook processing error", e);
      return Response.json({ error: "Processing failed." }, { status: 500 });
    }
  }

  return Response.json({ received: true });
}
