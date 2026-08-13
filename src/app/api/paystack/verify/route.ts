import { db } from "@/db";
import { payments, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { premiumExpiryFrom, PREMIUM_HOURS } from "@/lib/plans";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getCurrentUser(req.headers);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return Response.json({ error: "Paystack is not configured." }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference");
  if (!reference) {
    return Response.json({ error: "Missing reference." }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: `Bearer ${secret}` },
      }
    );
    const data = await res.json();
    if (!res.ok || !data.status) {
      return Response.json(
        { error: data.message || "Verification failed." },
        { status: 502 }
      );
    }

    const paid = data.data.status === "success";

    await db
      .update(payments)
      .set({ status: paid ? "success" : "failed" })
      .where(eq(payments.reference, reference));

    if (paid) {
      // 24-hour pass — stacks on any remaining time.
      const until = premiumExpiryFrom(user.premiumUntil);
      await db
        .update(users)
        .set({ plan: "premium", premiumUntil: until })
        .where(eq(users.id, user.id));
      return Response.json({
        success: true,
        status: data.data.status,
        premiumUntil: until,
        hours: PREMIUM_HOURS,
      });
    }

    return Response.json({ success: false, status: data.data.status });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Verification failed." }, { status: 500 });
  }
}
