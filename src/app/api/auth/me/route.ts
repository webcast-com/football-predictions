import { getCurrentUser, isPremiumActive } from "@/lib/auth";
import { isSupabaseEnabled } from "@/lib/supabase";
import { hoursLeft, PREMIUM_HOURS, PREMIUM_PRICE, PREMIUM_CURRENCY } from "@/lib/plans";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ user: null });
  return Response.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      plan: user.plan,
      role: user.role,
      premiumUntil: user.premiumUntil,
      premiumActive: isPremiumActive(user),
      premiumHoursLeft: hoursLeft(user.premiumUntil),
      authProvider: isSupabaseEnabled() ? "supabase" : "local",
      price: PREMIUM_PRICE,
      currency: PREMIUM_CURRENCY,
      passHours: PREMIUM_HOURS,
    },
  });
}
