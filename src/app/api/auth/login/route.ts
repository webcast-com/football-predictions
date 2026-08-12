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
    // This is attempted first when Supabase is configured, but any failure
    // (unreachable project, unknown user, invalid keys…) falls through to the
    // built-in local auth below instead of failing the request. Supabase keys
    // are optional configuration, and local accounts must stay able to log in.
    if (isSupabaseEnabled()) {
      let supabaseUser: { user_metadata?: { name?: string } } | null = null;
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: String(password),
        });
        if (!error && data.user) {
          supabaseUser = data.user;
        } else {
          console.warn(
            "[auth] Supabase sign-in failed, falling back to local auth:",
            error?.message
          );
        }
      } catch (err) {
        console.warn(
          "[auth] Supabase unreachable, falling back to local auth:",
          err instanceof Error ? err.message : err
        );
      }

      if (supabaseUser) {
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
              name: supabaseUser.user_metadata?.name || normalizedEmail.split("@")[0],
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
      // Otherwise fall through to the local auth path below.
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
