import { db } from "@/db";
import { payments } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import {
  PREMIUM_AMOUNT,
  PREMIUM_CURRENCY,
  PREMIUM_HOURS,
} from "@/lib/plans";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return Response.json(
      {
        error:
          "Paystack is not configured. Add PAYSTACK_SECRET_KEY to your environment to enable live payments.",
      },
      { status: 503 }
    );
  }

  try {
    const origin = new URL(req.url).origin;
    const callbackUrl = `${origin}/dashboard/premium?verify=1`;

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount: PREMIUM_AMOUNT, // KES 100 in cents
        currency: PREMIUM_CURRENCY,
        callback_url: callbackUrl,
        metadata: {
          userId: user.id,
          plan: "premium",
          duration: `${PREMIUM_HOURS}h`,
          description: `Predikt Premium ${PREMIUM_HOURS}-hour pass`,
        },
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.status) {
      return Response.json(
        { error: data.message || "Failed to initialize payment." },
        { status: 502 }
      );
    }

    await db.insert(payments).values({
      userId: user.id,
      reference: data.data.reference,
      amount: PREMIUM_AMOUNT,
      currency: PREMIUM_CURRENCY,
      plan: "premium",
      status: "pending",
    });

    return Response.json({
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Payment initialization failed." }, { status: 500 });
  }
}
