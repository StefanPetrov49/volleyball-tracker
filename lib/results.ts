import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import { matchResults, teams } from "@/db/schema";

const teamA = alias(teams, "team_a");
const teamB = alias(teams, "team_b");

const columns = {
  id: matchResults.id,
  setsWonA: matchResults.setsWonA,
  setsWonB: matchResults.setsWonB,
  sets: matchResults.sets,
  videoUrl: matchResults.videoUrl,
  playedAt: matchResults.playedAt,
  teamA: { name: teamA.name, logoUrl: teamA.logoUrl },
  teamB: { name: teamB.name, logoUrl: teamB.logoUrl },
};

export async function getMatchResults() {
  return db
    .select(columns)
    .from(matchResults)
    .innerJoin(teamA, eq(matchResults.teamAId, teamA.id))
    .innerJoin(teamB, eq(matchResults.teamBId, teamB.id))
    .orderBy(desc(matchResults.playedAt));
}

export type ResultWithTeams = Awaited<ReturnType<typeof getMatchResults>>[number];

export async function getMatchResult(id: number) {
  if (!Number.isInteger(id)) return null;

  const [row] = await db
    .select(columns)
    .from(matchResults)
    .innerJoin(teamA, eq(matchResults.teamAId, teamA.id))
    .innerJoin(teamB, eq(matchResults.teamBId, teamB.id))
    .where(eq(matchResults.id, id))
    .limit(1);

  return row ?? null;
}