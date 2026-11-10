import { eq, or } from "drizzle-orm";
import { db } from "../db";
import { matchResults, teams, user } from "../../db/schema";
import type { Match } from "../../types/match";
import { getMatches, OUR_TEAM_SLUG, splitUpcomingPast } from "./matches";

/** Everything the /admin hub shows, in one call. */
export async function getAdminOverview() {
  const [matches, users, ourTeam] = await Promise.all([
    getMatches(),
    db
      .select({ name: user.name, role: user.role, mustChangePassword: user.mustChangePassword, banned: user.banned })
      .from(user),
    db.select({ id: teams.id }).from(teams).where(eq(teams.slug, OUR_TEAM_SLUG)).limit(1),
  ]);

  const { upcoming, past } = splitUpcomingPast(matches);
  const active = users.filter((u) => !u.banned);

  // Our finished results (all of them, linked to the schedule or not)
  let played = 0;
  let wins = 0;
  const ourId = ourTeam[0]?.id;
  if (ourId !== undefined) {
    const rows = await db
      .select({ a: matchResults.teamAId, wonA: matchResults.setsWonA, wonB: matchResults.setsWonB, sets: matchResults.sets })
      .from(matchResults)
      .where(or(eq(matchResults.teamAId, ourId), eq(matchResults.teamBId, ourId)));
    for (const r of rows) {
      if (r.sets.length === 0) continue;
      played++;
      const [us, them] = r.a === ourId ? [r.wonA, r.wonB] : [r.wonB, r.wonA];
      if (us > them) wins++;
    }
  }

  return {
    upcomingCount: upcoming.length,
    pastCount: past.length,
    /** played matches (per the schedule) without a finished result – newest first */
    missingResult: past.filter((m) => !m.result?.finished) as Match[],
    /** upcoming matches without a hall or time */
    missingInfo: upcoming.filter((m) => !m.time || !m.location?.trim()) as Match[],
    /** active players who still have a temporary password */
    waitingPassword: active.filter((u) => u.mustChangePassword).map((u) => u.name),
    players: active.length,
    admins: active.filter((u) => u.role === "admin").length,
    deactivated: users.length - active.length,
    played,
    wins,
  };
}
