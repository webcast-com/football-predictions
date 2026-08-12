import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users, sessions } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import type { User } from "@/db/schema";

const SESSION_COOKIE = "fp_session";
const SESSION_DAYS = 30;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const hashBuffer = Buffer.from(key, "hex");
  const derived = scryptSync(password, salt, 64);
  if (hashBuffer.length !== derived.length) return false;
  return timingSafeEqual(hashBuffer, derived);
}

export async function createSession(userId: number): Promise<string> {
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const [session] = await db
    .insert(sessions)
    .values({ userId, expiresAt })
    .returning();
  const jar = await cookies();
  jar.set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  return session.token;
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.token, token));
    jar.delete(SESSION_COOKIE);
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select()
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .limit(1);
  if (rows.length === 0) return null;
  const user = rows[0].users;
  // downgrade if premium expired
  if (
    user.plan === "premium" &&
    user.premiumUntil &&
    user.premiumUntil < new Date()
  ) {
    await db
      .update(users)
      .set({ plan: "free", premiumUntil: null })
      .where(eq(users.id, user.id));
    user.plan = "free";
    user.premiumUntil = null;
  }
  return user;
}

export function isPremiumActive(user: User | null): boolean {
  if (!user) return false;
  if (user.plan !== "premium") return false;
  if (user.premiumUntil && user.premiumUntil < new Date()) return false;
  return true;
}
