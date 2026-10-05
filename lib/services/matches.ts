import { asc, eq } from "drizzle-orm";
import { db } from "../db";
import { matches } from "../../db/schema";
import type { Match } from "../../types/match";
import { MatchInput } from "../validation/match";

const hhmm = (t: string | null) => (t ? t.slice(0, 5) : null);

export async function getMatches(): Promise<Match[]> {
  const rows = await db.select().from(matches).orderBy(asc(matches.date), asc(matches.time));
  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    time: hhmm(r.time),
    opponent: r.opponent,
    location: r.location,
    home: r.home,
  }));
}

export async function createMatch(input: MatchInput) {
  const [row] = await db.insert(matches).values(input).returning({ id: matches.id });
  return row.id;
}

export async function updateMatch(id: string, input: MatchInput) {
  const rows = await db.update(matches).set(input).where(eq(matches.id, id)).returning({ id: matches.id });
  return rows.length > 0;
}

export async function deleteMatch(id: string) {
  const rows = await db.delete(matches).where(eq(matches.id, id)).returning({ id: matches.id });
  return rows.length > 0;
}