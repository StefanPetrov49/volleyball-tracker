import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import { matchResults, teams } from "@/db/schema";
import {
  getMatchStatus,
  LIVE_WINDOW_MS,
  type MatchStatus,
} from "@/lib/match-status";

const teamA = alias(teams, "team_a");
const teamB = alias(teams, "team_b");

const columns = {
  id: matchResults.id,
  teamAId: matchResults.teamAId,
  teamBId: matchResults.teamBId,
  setsWonA: matchResults.setsWonA,
  setsWonB: matchResults.setsWonB,
  sets: matchResults.sets,
  videoUrl: matchResults.videoUrl,
  playedAt: matchResults.playedAt,
  teamA: { name: teamA.name, logoUrl: teamA.logoUrl },
  teamB: { name: teamB.name, logoUrl: teamB.logoUrl },
};

async function getRows() {
  return db
    .select(columns)
    .from(matchResults)
    .innerJoin(teamA, eq(matchResults.teamAId, teamA.id))
    .innerJoin(teamB, eq(matchResults.teamBId, teamB.id))
    .orderBy(desc(matchResults.playedAt));
}

type Row = Awaited<ReturnType<typeof getRows>>[number];

export type ResultWithTeams = Row & { status: MatchStatus };

const withStatus = (row: Row): ResultWithTeams => ({
  ...row,
  status: getMatchStatus(row),
});

const RANK: Record<MatchStatus, number> = {
  live: 0,
  upcoming: 1,
  pending: 2,
  finished: 2,
};

export async function getMatchResults(): Promise<ResultWithTeams[]> {
  const rows = (await getRows()).map(withStatus);

  return rows.sort((a, b) => {
    if (RANK[a.status] !== RANK[b.status]) return RANK[a.status] - RANK[b.status];

    if (a.status === "upcoming") {
      return a.playedAt.getTime() - b.playedAt.getTime();
    }

    return b.playedAt.getTime() - a.playedAt.getTime();
  });
}

export async function getMatchResult(id: number): Promise<ResultWithTeams | null> {
  if (!Number.isInteger(id)) return null;

  const [row] = await db
    .select(columns)
    .from(matchResults)
    .innerJoin(teamA, eq(matchResults.teamAId, teamA.id))
    .innerJoin(teamB, eq(matchResults.teamBId, teamB.id))
    .where(eq(matchResults.id, id))
    .limit(1);

  return row ? withStatus(row) : null;
}

export async function getLiveMatches(): Promise<ResultWithTeams[]> {
  const now = new Date();
  const since = new Date(now.getTime() - LIVE_WINDOW_MS);

  const rows = await db
    .select(columns)
    .from(matchResults)
    .innerJoin(teamA, eq(matchResults.teamAId, teamA.id))
    .innerJoin(teamB, eq(matchResults.teamBId, teamB.id))
    .where(
      and(
        sql`jsonb_array_length(${matchResults.sets}) = 0`,
        lte(matchResults.playedAt, now),
        gte(matchResults.playedAt, since),
      ),
    )
    .orderBy(asc(matchResults.playedAt));

  return rows.map(withStatus);
}