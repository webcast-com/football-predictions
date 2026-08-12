import {
  pgTable,
  serial,
  text,
  integer,
  real,
  timestamp,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  plan: text("plan").notNull().default("free"), // 'free' | 'premium'
  premiumUntil: timestamp("premium_until"),
  role: text("role").notNull().default("user"), // 'user' | 'admin'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  token: uuid("token").primaryKey().defaultRandom(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const predictions = pgTable("predictions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  league: text("league").notNull(),
  matchDate: timestamp("match_date").notNull(),
  market: text("market").notNull(), // e.g. "1X2", "Over/Under 2.5", "BTTS"
  tip: text("tip").notNull(), // e.g. "Home Win", "Over 2.5"
  odds: real("odds").notNull().default(1.5),
  confidence: integer("confidence").notNull().default(70), // 0-100
  status: text("status").notNull().default("pending"), // 'pending' | 'won' | 'lost'
  isPremium: boolean("is_premium").notNull().default(false),
  analysis: text("analysis").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  reference: text("reference").notNull().unique(),
  amount: integer("amount").notNull(), // in kobo
  currency: text("currency").notNull().default("KES"),
  plan: text("plan").notNull().default("premium"),
  status: text("status").notNull().default("pending"), // 'pending' | 'success' | 'failed'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull().default(""),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Prediction = typeof predictions.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type ContactMessage = typeof contactMessages.$inferSelect;
