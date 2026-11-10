/**
 * One-time: link existing results (match_results) to scheduled matches (matches).
 *
 *   npm run results:link             → dry run, only prints what it would do
 *   npm run results:link -- --apply  → writes the links
 *
 * Production:
 *   DATABASE_URL="$PROD_DB_URL" npm run results:link
 *   DATABASE_URL="$PROD_DB_URL" npm run results:link -- --apply
 *
 * Rule: a result is linked to the scheduled match on the same day (Sofia time).
 * If several matches are on that day, the opponent name must match too.
 * Results it can't pair are listed so you can link them in the admin form.
 */
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { alias } from "drizzle-orm/pg-core";
import { eq, isNull } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "../db/schema";
import { dateToSofiaLocal } from "../lib/datetime";

config({ path: ".env.local", quiet: true }); // never overrides an exported DATABASE_URL

const { matches, matchResults, teams } = schema;
const OUR_TEAM_SLUG = "yakite-pichove";
const apply = process.argv.includes("--apply");
const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const pool = new Pool({ connectionString: url, max: 1 });
  const db = drizzle(pool, { schema });
  console.log(`DB: ${new URL(url).host}  |  mode: ${apply ? "APPLY" : "dry run"}\n`);

  const teamA = alias(teams, "team_a");
  const teamB = alias(teams, "team_b");

  const results = await db
    .select({
      id: matchResults.id,
      playedAt: matchResults.playedAt,
      aSlug: teamA.slug,
      aName: teamA.name,
      bSlug: teamB.slug,
      bName: teamB.name,
    })
    .from(matchResults)
    .innerJoin(teamA, eq(teamA.id, matchResults.teamAId))
    .innerJoin(teamB, eq(teamB.id, matchResults.teamBId))
    .where(isNull(matchResults.matchId));

  const schedule = await db
    .select({ id: matches.id, date: matches.date, opponent: matches.opponent, linked: matchResults.id })
    .from(matches)
    .leftJoin(matchResults, eq(matchResults.matchId, matches.id));

  const free = schedule.filter((m) => m.linked === null);
  const used = new Set<string>();
  const links: { resultId: number; matchId: string }[] = [];

  for (const r of results) {
    const day = dateToSofiaLocal(r.playedAt).slice(0, 10);
    const label = `#${r.id} ${day} ${r.aName} – ${r.bName}`;

    if (r.aSlug !== OUR_TEAM_SLUG && r.bSlug !== OUR_TEAM_SLUG) {
      console.log(`  skip  ${label}  (не е наш мач)`);
      continue;
    }
    const opponent = r.aSlug === OUR_TEAM_SLUG ? r.bName : r.aName;
    const sameDay = free.filter((m) => m.date === day && !used.has(m.id));
    const pick =
      sameDay.length === 1
        ? sameDay[0]
        : sameDay.find((m) => norm(m.opponent) === norm(opponent));

    if (!pick) {
      const why = sameDay.length === 0 ? "няма мач в графика на тази дата" : "няколко мача на датата, имената не съвпадат";
      console.log(`  ???   ${label}  (${why})`);
      continue;
    }

    used.add(pick.id);
    links.push({ resultId: r.id, matchId: pick.id });
    const nameNote = norm(pick.opponent) === norm(opponent) ? "" : `  ← в графика: "${pick.opponent}"`;
    console.log(`  link  ${label}${nameNote}`);
  }

  console.log(`\n${links.length} за свързване, ${results.length - links.length} без връзка.`);

  if (apply && links.length > 0) {
    await db.transaction(async (tx) => {
      for (const l of links) {
        await tx.update(matchResults).set({ matchId: l.matchId }).where(eq(matchResults.id, l.resultId));
      }
    });
    console.log("✓ Записано.");
  } else if (!apply && links.length > 0) {
    console.log("Пусни отново с --apply, за да запишеш.");
  }

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
