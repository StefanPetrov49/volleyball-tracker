import { asc } from "drizzle-orm";
import { db } from "../db";
import { matches } from "../../db/schema";
import type { Match } from "../../types/match";

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
    scoreUs: r.scoreUs,
    scoreThem: r.scoreThem,
  }));
}