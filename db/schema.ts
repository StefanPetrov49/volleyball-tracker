import {
  boolean,
  date,
  integer,
  pgTable,
  text,
  time,
  timestamp,
  unique,
  uuid,
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
  scoreUs: integer("score_us"),
  scoreThem: integer("score_them"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const polls = pgTable("polls", {
  id: uuid("id").primaryKey().defaultRandom(),
  question: text("question").notNull(),
  createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
  matchId: uuid("match_id").references(() => matches.id, { onDelete: "set null" }),
  addedOptionId: uuid("added_option_id"),
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
  (t) => [unique("votes_poll_user_unique").on(t.pollId, t.userId)]
);