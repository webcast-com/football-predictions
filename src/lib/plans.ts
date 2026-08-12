/**
 * Subscription plans.
 *
 * FREE    — KES 0, free daily tips only, VIP picks locked.
 * PREMIUM — KES 100 grants 24 hours of full VIP access.
 *           Buying again while still active stacks another 24 hours.
 */

export const PREMIUM_CURRENCY = "KES";
export const PREMIUM_PRICE = 100; // KES
export const PREMIUM_AMOUNT = PREMIUM_PRICE * 100; // Paystack sub-units (cents)
export const PREMIUM_HOURS = 24;

/** New premium expiry: stacks on top of any remaining premium time. */
export function premiumExpiryFrom(currentUntil: Date | string | null): Date {
  const now = Date.now();
  const base = currentUntil ? new Date(currentUntil).getTime() : 0;
  const start = Math.max(now, base);
  return new Date(start + PREMIUM_HOURS * 60 * 60 * 1000);
}

export function hoursLeft(until: Date | string | null): number {
  if (!until) return 0;
  const ms = new Date(until).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (60 * 60 * 1000)));
}
