import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// DATABASE_URL works with local Postgres or a Supabase connection string, e.g.
//   postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

let cachedPool: Pool | null = null;
let cachedDb: NodePgDatabase<Record<string, never>> | null = null;

function getPool(): Pool {
  if (!cachedPool) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is required");
    }

    // Hosted databases like Supabase require SSL.
    const needsSsl =
      databaseUrl.includes("supabase.co") || databaseUrl.includes("sslmode=require");

    cachedPool =
      globalForDb.__arenaNextJsPostgresqlPool ??
      new Pool({
        connectionString: databaseUrl,
        ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
      });

    if (process.env.NODE_ENV !== "production") {
      globalForDb.__arenaNextJsPostgresqlPool = cachedPool;
    }
  }
  return cachedPool;
}

function getDb(): NodePgDatabase<Record<string, never>> {
  cachedDb ??= drizzle(getPool());
  return cachedDb;
}

/**
 * Lazily resolve a value on first property access so that importing this
 * module (e.g. during `next build`) never requires DATABASE_URL. The error
 * is only thrown when the database is actually used at request time.
 */
function lazy<T extends object>(get: () => T): T {
  return new Proxy({} as T, {
    get(_target, prop) {
      const target = get();
      const value = Reflect.get(target, prop);
      return typeof value === "function" ? value.bind(target) : value;
    },
    has(_target, prop) {
      return prop in get();
    },
  });
}

export const pool = lazy(getPool);
export const db = lazy(getDb);
