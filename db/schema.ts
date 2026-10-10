import {
  boolean,
  date,
  pgTable,
  text,
  time,
  timestamp,
  unique,
  uuid,
  serial,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export * from "./auth-schema";

export const matches = pgTable("matches", {
  id: uuid("id").primaryKey().defaultRandom(),
  date: date("date", { mode: "string" }).notNull(),
  time: time("time"),
  opponent: text("opponent").notNull(),
  location: text("location"),
  home: boolean("home").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const polls = pgTable("polls", {
  id: uuid("id").primaryKey().defaultRandom(),
  question: text("question").notNull(),
  createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pollOptions = pgTable("poll_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  pollId: uuid("poll_id")
    .notNull()
    .references(() => polls.id, { onDelete: "cascade" }),
  date: date("date", { mode: "string" }).notNull(),
  time: time("time"),
  location: text("location"),
});

export const votes = pgTable(
  "votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pollId: uuid("poll_id")
      .notNull()
      .references(() => polls.id, { onDelete: "cascade" }),
    optionId: uuid("option_id")
      .notNull()
      .references(() => pollOptions.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [unique("votes_option_user_unique").on(t.optionId, t.userId)]
);

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
});

export const matchResults = pgTable("match_results", {
  id: serial("id").primaryKey(),
  teamAId: integer("team_a_id").notNull().references(() => teams.id),
  teamBId: integer("team_b_id").notNull().references(() => teams.id),
  setsWonA: integer("sets_won_a").notNull(),
  setsWonB: integer("sets_won_b").notNull(),
  sets: jsonb("sets").$type<{ a: number; b: number }[]>().notNull().default([]),
  videoUrl: text("video_url"),
  playedAt: timestamp("played_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type MatchResult = typeof matchResults.$inferSelect;
export type NewMatchResult = typeof matchResults.$inferInsert;