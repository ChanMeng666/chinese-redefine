import {
  pgTable,
  text,
  boolean,
  timestamp,
  integer,
  serial,
  date,
  unique,
} from "drizzle-orm/pg-core";

// ========== Business tables only ==========
// Users are managed by Neon Auth in the neon_auth schema
// userId fields store the Neon Auth user ID (no FK constraint)

export const cards = pgTable("cards", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  word: text("word").notNull(),
  explanation: text("explanation").notNull(),
  pinyin: text("pinyin"),
  english: text("english"),
  japanese: text("japanese"),
  svgContent: text("svg_content").notNull(),
  isPublic: boolean("is_public").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userUsage = pgTable(
  "user_usage",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    date: date("date").notNull(),
    dailyCount: integer("daily_count").notNull().default(0),
  },
  (table) => [unique("user_usage_unique").on(table.userId, table.date)]
);

export const globalUsage = pgTable("global_usage", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(),
  dailyCount: integer("daily_count").notNull().default(0),
  monthlyCount: integer("monthly_count").notNull().default(0),
});
