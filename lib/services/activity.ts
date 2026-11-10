import { desc, inArray, lt } from "drizzle-orm";
import { db } from "../db";
import { activityLog, teams } from "../../db/schema";
import { log } from "../logger";
import { monthShortBg, parseMatchDate } from "../datetime";

const KEEP_DAYS = 180;

export type Actor = { id: string; name: string };

/**
 * Records one admin/member change for "Последни промени".
 * Never throws: a logging problem must not break the action itself.
 */
export async function logActivity(
  actor: Actor,
  action: string,
  summary: string,
  href: string | null = null,
): Promise<void> {
  try {
    await db.insert(activityLog).values({ actorId: actor.id, actorName: actor.name, action, summary, href });
    // cheap housekeeping (indexed): drop rows older than KEEP_DAYS
    await db.delete(activityLog).where(lt(activityLog.createdAt, new Date(Date.now() - KEEP_DAYS * 86_400_000)));
  } catch (e) {
    log.warn("activity.log_failed", { action, reason: e instanceof Error ? e.message : String(e) });
  }
}

export async function getRecentActivity(limit = 10) {
  try {
    return await db.select().from(activityLog).orderBy(desc(activityLog.createdAt), desc(activityLog.id)).limit(limit);
  } catch (e) {
    // e.g. the table isn't created yet – the admin page still works
    log.warn("activity.read_failed", { reason: e instanceof Error ? e.message : String(e) });
    return [];
  }
}

export type ActivityRow = Awaited<ReturnType<typeof getRecentActivity>>[number];

/** "vs Чуковете · 20 ное" – for match summaries */
export function matchSummary(m: { opponent: string; date: string }) {
  const d = parseMatchDate(m.date);
  return `vs ${m.opponent} · ${d.getDate()} ${monthShortBg(d.getMonth())}`;
}

/** "Яките пичове 3:1 Легендите" (finished) or "Яките пичове – Легендите" (no sets yet) */
export async function resultSummary(r: { teamAId: number; teamBId: number; setsWonA: number; setsWonB: number; sets: unknown[] }) {
  const rows = await db.select({ id: teams.id, name: teams.name }).from(teams).where(inArray(teams.id, [r.teamAId, r.teamBId]));
  const name = (id: number) => rows.find((t) => t.id === id)?.name ?? "?";
  return r.sets.length > 0
    ? { finished: true, text: `${name(r.teamAId)} ${r.setsWonA}:${r.setsWonB} ${name(r.teamBId)}` }
    : { finished: false, text: `${name(r.teamAId)} – ${name(r.teamBId)}` };
}
