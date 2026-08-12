#!/usr/bin/env node
/**
 * Predikt — local database bootstrap.
 *
 * Starts a self-contained PostgreSQL instance (via the `embedded-postgres`
 * npm package, no system install required) on the host/port/database taken
 * from DATABASE_URL, creates the database and the app tables, then keeps
 * running so the server stays available for the app.
 *
 * Usage:
 *   node scripts/db-up.mjs            # initialise (if needed), start, create schema
 *
 * The process stays alive until it receives SIGINT/SIGTERM. It is idempotent:
 * re-running it against an already-running instance simply verifies the
 * database + schema and then watches the existing server.
 *
 * Set PGDATA_DIR to store the data files somewhere else (default: ./.pgdata).
 */

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import EmbeddedPostgres from "embedded-postgres";
import pg from "pg";

const DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/app_db";
const parsed = new URL(DATABASE_URL);

const user = decodeURIComponent(parsed.username || "postgres");
const password = decodeURIComponent(parsed.password || "postgres");
const host = parsed.hostname || "127.0.0.1";
const port = Number(parsed.port || 5432);
const dbName = parsed.pathname.replace(/^\//, "") || "app_db";

const databaseDir =
  process.env.PGDATA_DIR || path.resolve(process.cwd(), ".pgdata");

// Mirrors src/db/schema.ts. Idempotent so it is safe to run on every start.
const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  password_hash text NOT NULL,
  plan text NOT NULL DEFAULT 'free',
  premium_until timestamp,
  role text NOT NULL DEFAULT 'user',
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  token uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamp NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS predictions (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  home_team text NOT NULL,
  away_team text NOT NULL,
  league text NOT NULL,
  match_date timestamp NOT NULL,
  market text NOT NULL,
  tip text NOT NULL,
  odds real NOT NULL DEFAULT 1.5,
  confidence integer NOT NULL DEFAULT 70,
  status text NOT NULL DEFAULT 'pending',
  is_premium boolean NOT NULL DEFAULT false,
  analysis text NOT NULL DEFAULT '',
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reference text NOT NULL UNIQUE,
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'KES',
  plan text NOT NULL DEFAULT 'premium',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id serial PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL DEFAULT '',
  message text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);
`;

async function tryConnect(database = "postgres") {
  const client = new pg.Client({
    host,
    port,
    user,
    password,
    database,
    connectionTimeoutMillis: 3000,
  });
  try {
    await client.connect();
    return client;
  } catch {
    return null;
  }
}

async function ensureDatabaseAndSchema(client) {
  const exists = await client.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [dbName]
  );
  if (exists.rowCount === 0) {
    // CREATE DATABASE cannot run inside a transaction; node-postgres wraps
    // multi-statement queries, so use the simple query protocol.
    await client.query({ text: `CREATE DATABASE "${dbName}"`, queryMode: "simple" });
  }

  const dbClient = await tryConnect(dbName);
  if (!dbClient) throw new Error(`Could not connect to database "${dbName}".`);
  await dbClient.query(SCHEMA_SQL);
  const tables = await dbClient.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
  );
  await dbClient.end();
  return tables.rows.map((r) => r.tablename);
}

// ── 1. Already running? Just verify and exit. ──────────────────────────
const existing = await tryConnect();
if (existing) {
  const tables = await ensureDatabaseAndSchema(existing);
  console.log(
    `[db-up] Postgres already running on ${host}:${port} — database "${dbName}" ready (${tables.join(", ")}).`
  );
  await existing.end();
  process.exit(0);
}

if (host !== "127.0.0.1" && host !== "localhost" && host !== "::1") {
  console.warn(
    `[db-up] DATABASE_URL points at a remote host (${host}) which this local bootstrap cannot serve. ` +
      `Point DATABASE_URL at 127.0.0.1:${port} (e.g. postgresql://${user}:***@127.0.0.1:${port}/${dbName}) to use the embedded Postgres.`
  );
  process.exit(1);
}

// ── 2. Initialise the cluster once ────────────────────────────────────
const pgInstance = new EmbeddedPostgres({
  databaseDir,
  user,
  password,
  port,
  persistent: true,
  onLog: (message) => {
    const line = message.trim();
    if (line) process.stdout.write(`[pg] ${line}\n`);
  },
});

const alreadyInitialised = fs.existsSync(path.join(databaseDir, "PG_VERSION"));
if (!alreadyInitialised) {
  console.log(`[db-up] Initialising Postgres cluster in ${databaseDir} …`);
  await pgInstance.initialise();
} else {
  console.log(`[db-up] Reusing existing cluster in ${databaseDir}.`);
}

console.log(`[db-up] Starting Postgres on ${host}:${port} …`);
await pgInstance.start();

const client = await tryConnect();
if (!client) {
  throw new Error(`[db-up] Started Postgres but could not connect on ${host}:${port}.`);
}
const tables = await ensureDatabaseAndSchema(client);
console.log(
  `[db-up] Database "${dbName}" ready — tables: ${tables.join(", ")}.`
);
await client.end();

// ── 3. Keep serving until told to stop ────────────────────────────────
const shutdown = async (signal) => {
  console.log(`[db-up] ${signal} received, shutting down.`);
  await pgInstance.stop().catch(() => {});
  process.exit(0);
};
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

console.log("[db-up] Ready. Press Ctrl+C to stop.");
await new Promise(() => {});
