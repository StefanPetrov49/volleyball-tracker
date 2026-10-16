export type MatchStatus = "live" | "upcoming" | "pending" | "finished";

export const LIVE_WINDOW_MS = 4 * 60 * 60 * 1000;

export function getMatchStatus(
  match: { sets: unknown[]; playedAt: Date },
  now: number = Date.now(),
): MatchStatus {
  if (match.sets.length > 0) return "finished";

  const start = match.playedAt.getTime();

  if (now < start) return "upcoming";
  if (now - start <= LIVE_WINDOW_MS) return "live";

  return "pending";
}