import { and, asc, eq, isNotNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../db";
import { matches, matchResults, teams } from "../../db/schema";
import type { Match, MatchResultSummary } from "../../types/match";
import { MatchInput } from "../validation/match";

/** Our team's slug in the teams table – used to know which side of a result is "us". */
export const OUR_TEAM_SLUG = "yakite-pichove";

const hhmm = (t: string | null) => (t ? t.slice(0, 5) : null);

const resultTeamA = alias(teams, "result_team_a");

// Scheduled match + its linked result (if any)
const columns = {
  id: matches.id,
  date: matches.date,
  time: matches.time,
  opponent: matches.opponent,
  location: matches.location,
  home: matches.home,
  resultId: matchResults.id,
  setsWonA: matchResults.setsWonA,
  setsWonB: matchResults.setsWonB,
  sets: matchResults.sets,
  teamASlug: resultTeamA.slug,
};

function baseQuery() {
  return db
    .select(columns)
    .from(matches)
    .leftJoin(matchResults, eq(matchResults.matchId, matches.id))
    .leftJoin(resultTeamA, eq(resultTeamA.id, matchResults.teamAId));
}

type Row = Awaited<ReturnType<typeof baseQuery>>[number];

function toResult(r: Row): MatchResultSummary | null {
  if (r.resultId === null) return null;
  // flip the score if we are team B in the result
  const weAreA = r.teamASlug === OUR_TEAM_SLUG;
  const sets = (r.sets ?? []).map((s) => (weAreA ? { us: s.a, them: s.b } : { us: s.b, them: s.a }));
  return {
    id: r.resultId,
    finished: sets.length > 0,
    us: (weAreA ? r.setsWonA : r.setsWonB) ?? 0,
    them: (weAreA ? r.setsWonB : r.setsWonA) ?? 0,
    sets,
  };
}

const toMatch = (r: Row): Match => ({
  id: r.id,
  date: r.date,
  time: hhmm(r.time),
  opponent: r.opponent,
  location: r.location,
  home: r.home,
  result: toResult(r),
});

export async function getMatches(): Promise<Match[]> {
  const rows = await baseQuery().orderBy(asc(matches.date), asc(matches.time));
  return rows.map(toMatch);
}

export async function getMatchById(id: string): Promise<Match | null> {
  const [row] = await baseQuery().where(eq(matches.id, id)).limit(1);
  return row ? toMatch(row) : null;
}

/** Scheduled matches for the "Мач от графика" dropdown in the result form. */
export async function getScheduleOptions() {
  return db
    .select({
      id: matches.id,
      date: matches.date,
      time: matches.time,
      opponent: matches.opponent,
      resultId: matchResults.id, // already linked to this result (or null)
    })
    .from(matches)
    .leftJoin(matchResults, eq(matchResults.matchId, matches.id))
    .orderBy(asc(matches.date), asc(matches.time));
}

export type ScheduleOption = Awaited<ReturnType<typeof getScheduleOptions>>[number];

const normName = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

/**
 * Prefill for "+ Резултат" on a scheduled match.
 * Returns the existing result's id if the match already has one.
 */
export async function getResultPrefill(matchId: string) {
  const match = await getMatchById(matchId);
  if (!match) return null;
  if (match.result) return { existingResultId: match.result.id };

  const allTeams = await db.select({ id: teams.id, name: teams.name, slug: teams.slug }).from(teams);
  const us = allTeams.find((t) => t.slug === OUR_TEAM_SLUG);

  // 1) a team with the same name
  let opponentId = allTeams.find((t) => normName(t.name) === normName(match.opponent))?.id;

  // 2) otherwise: the team used in an earlier result linked to a match with this opponent text
  //    (e.g. schedule says "Инкредибалс", team is "The Incrediballs")
  if (!opponentId) {
    const earlier = await db
      .select({ a: matchResults.teamAId, b: matchResults.teamBId })
      .from(matchResults)
      .innerJoin(matches, eq(matches.id, matchResults.matchId))
      .where(and(isNotNull(matchResults.matchId), eq(matches.opponent, match.opponent)))
      .limit(1);
    if (earlier[0]) opponentId = earlier[0].a === us?.id ? earlier[0].b : earlier[0].a;
  }

  const ourId = us ? String(us.id) : "";
  const theirId = opponentId ? String(opponentId) : "";
  return {
    matchId: match.id,
    // home team first
    teamAId: match.home ? ourId : theirId,
    teamBId: match.home ? theirId : ourId,
    playedAt: `${match.date}T${match.time ?? "12:00"}`,
  };
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
