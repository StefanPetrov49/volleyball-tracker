import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { teams } from "@/db/schema";

export type Team = typeof teams.$inferSelect;

export async function getTeams(): Promise<Team[]> {
  return db.select().from(teams).orderBy(asc(teams.name));
}