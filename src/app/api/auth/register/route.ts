import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, createSession } from "@/lib/auth";
import { isSupabaseEnabled, getSupabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();
    if (!name || !email || !password) {
      return Response.json({ error: "All fields are required." }, { status: 400 });
    }
    if (String(password).length < 6) {
      return Response.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }
    const normalizedEmail = String(email).toLowerCase().trim();
    const displayName = String(name).trim();

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);
    if (existing.length > 0) {
      return Response.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // ── Supabase Auth path ──────────────────────────────────────────
    if (isSupabaseEnabled()) {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: String(password),
        options: { data: { name: displayName } },
      });
      if (error) {
        return Response.json({ error: error.message }, { status: 400 });
      }
      // Mirror the profile locally for plan/subscription tracking.
      const [user] = await db
        .insert(users)
        .values({
          name: displayName,
          email: normalizedEmail,
          passwordHash: "supabase-managed",
        })
        .returning();
      await createSession(user.id);
      return Response.json({
        user: { id: user.id, name: user.name, email: user.email, plan: user.plan },
        provider: "supabase",
      });
    }

    // ── Local auth fallback ─────────────────────────────────────────
    const [user] = await db
      .insert(users)
      .values({
        name: displayName,
        email: normalizedEmail,
        passwordHash: hashPassword(String(password)),
      })
      .returning();
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
