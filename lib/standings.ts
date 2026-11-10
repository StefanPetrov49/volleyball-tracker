/**
 * League standings from volleymania.com (our league doesn't offer an API).
 * Only our group's table is read. The page is fetched at most every 10 minutes
 * (Next.js fetch cache), no matter how many people press the button.
 */

export const STANDINGS_SOURCE_URL = "https://www.volleymania.com/standings";

/** Our group's heading on volleymania – change this when the group changes next season. */
export const OUR_GROUP = '"А" дивизия - Група C';
export const OUR_TEAM_NAME = "Яките пичове";

const CACHE_SECONDS = 600; // 10 minutes

export type StandingRow = {
  rank: number;
  team: string;
  points: number; // т – points incl. cup points
  cupPoints: number; // тк
  played: number; // м
  won: number; // п
  lost: number; // з
  sets: string; // г – "8-4"
  setRatio: string; // гс – "2.0000" or "max"
  pointsDiff: string; // тр – "279-247"
  pointsRatio: string; // тс – "1.1296"
};

export type Standings = {
  group: string;
  rows: StandingRow[];
  updatedAt: string; // ISO time volleymania was last fetched
  sourceUrl: string;
};

// ---------- parsing ----------

/** Makes names comparable: case, quotes, dashes, spaces and Latin/Cyrillic look-alikes (A/А, C/С…). */
export function normalizeName(s: string): string {
  const lookalikes: Record<string, string> = { a: "а", b: "в", c: "с", e: "е", h: "н", k: "к", m: "м", o: "о", p: "р", t: "т", x: "х", y: "у" };
  return s
    .toLowerCase()
    .replace(/[„“”"«»']/g, "")
    .replace(/[‐-―−]/g, "-")
    .replace(/[abcehkmoptxy]/g, (ch) => lookalikes[ch])
    .replace(/\s+/g, " ")
    .trim();
}

const decodeEntities = (s: string) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&");

/** Visible text of an HTML fragment. */
const textOf = (html: string) => decodeEntities(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();

const toInt = (s: string) => {
  const n = Number(s);
  return Number.isInteger(n) ? n : NaN;
};

/**
 * Extracts one group's table from the volleymania standings page.
 * Returns null if the group isn't found or the table doesn't look as expected
 * (so a layout change on their side shows a friendly error instead of wrong data).
 */
export function parseGroupStandings(html: string, group: string = OUR_GROUP): StandingRow[] | null {
  // Their page contains old tables inside HTML comments – drop all comments first
  const clean = html.replace(/<!--[\s\S]*?-->/g, "");

  const rows = [...clean.matchAll(/<tr\b[^>]*>([\s\S]*?)(?=<tr\b|<\/table>)/gi)].map((m) =>
    [...m[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((c) => textOf(c[1])),
  );

  const wanted = normalizeName(group);
  const start = rows.findIndex((cells) => cells.length === 1 && normalizeName(cells[0]) === wanted);
  if (start === -1) return null;

  const result: StandingRow[] = [];
  for (const cells of rows.slice(start + 1)) {
    if (cells.length === 1) break; // next group's heading
    if (cells.length !== 11) continue; // e.g. the column header row
    const [rank, team, points, cupPoints, played, won, lost, sets, setRatio, pointsDiff, pointsRatio] = cells;
    if (!/^\d+$/.test(rank)) continue; // header row has "^" here
    const row: StandingRow = {
      rank: toInt(rank),
      team,
      points: toInt(points),
      cupPoints: toInt(cupPoints),
      played: toInt(played),
      won: toInt(won),
      lost: toInt(lost),
      sets,
      setRatio,
      pointsDiff,
      pointsRatio,
    };
    if ([row.points, row.cupPoints, row.played, row.won, row.lost].some(Number.isNaN) || !team) return null;
    result.push(row);
  }

  return result.length > 0 ? result : null;
}

// ---------- fetching ----------

export class StandingsError extends Error {}

export async function getOurStandings(): Promise<Standings> {
  let res: Response;
  try {
    res = await fetch(STANDINGS_SOURCE_URL, {
      next: { revalidate: CACHE_SECONDS },
      headers: { "User-Agent": "YakitePichove-team-site (+https://volleyball-tracker-two.vercel.app)" },
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new StandingsError("volleymania не отговаря");
  }
  if (!res.ok) throw new StandingsError(`volleymania върна ${res.status}`);

  const rows = parseGroupStandings(await res.text());
  if (!rows) throw new StandingsError("таблицата на групата не беше намерена");

  // The cached response keeps volleymania's Date header → when it was really fetched
  const fetched = new Date(res.headers.get("date") ?? Date.now());
  return {
    group: OUR_GROUP,
    rows,
    updatedAt: (Number.isNaN(fetched.getTime()) ? new Date() : fetched).toISOString(),
    sourceUrl: STANDINGS_SOURCE_URL,
  };
}
