-- Predikt schema — mirrors src/db/schema.ts.
-- Mounted into /docker-entrypoint-initdb.d so Postgres creates tables on first init.
-- Idempotent (CREATE TABLE IF NOT EXISTS) so re-running is safe.

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
