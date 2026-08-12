import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// DATABASE_URL works with local Postgres or a Supabase connection string, e.g.
//   postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

// Hosted databases like Supabase require SSL.
const needsSsl =
  databaseUrl.includes("supabase.co") || databaseUrl.includes("sslmode=require");

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
    ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
