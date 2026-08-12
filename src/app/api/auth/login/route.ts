import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, createSession } from "@/lib/auth";
import { isSupabaseEnabled, getSupabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return Response.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }
    const normalizedEmail = String(email).toLowerCase().trim();

    // ── Supabase Auth path ──────────────────────────────────────────
    if (isSupabaseEnabled()) {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: String(password),
      });
      if (error || !data.user) {
        return Response.json(
          { error: "Invalid email or password." },
          { status: 401 }
        );
      }
      // Mirror/lookup the local profile (plan & payments live locally).
      let rows = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);
      if (rows.length === 0) {
        rows = await db
          .insert(users)
          .values({
            name: (data.user.user_metadata?.name as string) || normalizedEmail.split("@")[0],
            email: normalizedEmail,
            passwordHash: "supabase-managed",
          })
          .returning();
      }
      const user = rows[0];
      await createSession(user.id);
      return Response.json({
        user: { id: user.id, name: user.name, email: user.email, plan: user.plan },
        provider: "supabase",
      });
    }

    // ── Local auth fallback ─────────────────────────────────────────
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);
    const user = rows[0];
    if (!user || !verifyPassword(String(password), user.passwordHash)) {
      return Response.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }
    await createSession(user.id);
    return Response.json({
      user: { id: user.id, name: user.name, email: user.email, plan: user.plan },
      provider: "local",
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}
