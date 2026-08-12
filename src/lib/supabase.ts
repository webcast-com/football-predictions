import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase integration.
 *
 * Configure these environment variables to authenticate users through
 * Supabase Auth and (optionally) point DATABASE_URL at your Supabase
 * Postgres connection string to use the Supabase database:
 *
 *   NEXT_PUBLIC_SUPABASE_URL      e.g. https://abcd.supabase.co
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY public anon key
 *   SUPABASE_SERVICE_ROLE_KEY     service role key (server-only)
 *
 * When the keys are absent the app automatically falls back to the
 * built-in local (Postgres) auth so the demo keeps working everywhere.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || anonKey;

export function isSupabaseEnabled(): boolean {
  return Boolean(url && anonKey);
}

let anonClient: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;

/** Anon key client — used for signUp / signInWithPassword. */
export function getSupabase(): SupabaseClient {
  if (!isSupabaseEnabled()) throw new Error("Supabase is not configured.");
  anonClient ??= createClient(url!, anonKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return anonClient;
}

/** Service role client — trusted server-side calls only. */
export function getSupabaseAdmin(): SupabaseClient {
  if (!isSupabaseEnabled()) throw new Error("Supabase is not configured.");
  adminClient ??= createClient(url!, serviceKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}

/**
 * Invoke a Supabase Edge Function from the app server.
 * Returns null silently when Supabase isn't configured or the call fails,
 * so callers can invoke fire-and-forget style.
 */
export async function invokeSupabaseFunction<T = unknown>(
  name: string,
  payload: unknown
): Promise<T | null> {
  if (!isSupabaseEnabled()) return null;
  try {
    const res = await fetch(`${url}/functions/v1/${name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return (await res.json().catch(() => null)) as T | null;
  } catch {
    return null;
  }
}
