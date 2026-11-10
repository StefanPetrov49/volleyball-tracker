const TZ = "Europe/Sofia";

function tzOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)!.value);

  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );

  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

export function sofiaLocalToDate(local: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2})?$/.exec(local);
  if (!m) return null;

  const [y, mo, d, h, mi] = m.slice(1, 6).map(Number);
  const asUtc = Date.UTC(y, mo - 1, d, h, mi);

  const offset = tzOffsetMs(new Date(asUtc), TZ);
  let utc = asUtc - offset;

  const offset2 = tzOffsetMs(new Date(utc), TZ);
  if (offset2 !== offset) utc = asUtc - offset2;

  return new Date(utc);
}

export function dateToSofiaLocal(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)!.value;

  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function nowSofiaLocal(): string {
  return dateToSofiaLocal(new Date());
}

export function formatSofia(date: Date): string {
  return date.toLocaleString("bg-BG", {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------- Date-only helpers for match dates ("YYYY-MM-DD") ----------

// Hardcoded: Intl's Bulgarian short month names differ between browsers/Node
// ("ное", "ноем.", or even "11"), so we use our own.
const BG_MONTHS_SHORT = ["яну", "фев", "мар", "апр", "май", "юни", "юли", "авг", "сеп", "окт", "ное", "дек"];

/**
 * "2026-11-11" → Date at local midnight of that day.
 * (new Date("2026-11-11") would be UTC midnight, which shows the previous day
 * for anyone west of UTC.)
 */
export function parseMatchDate(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Month index 0-11 → "яну" … "дек" */
export const monthShortBg = (monthIndex: number) => BG_MONTHS_SHORT[monthIndex];

/**
 * Real start time of a scheduled match (ms since epoch), treating the stored
 * date/time as Sofia time no matter where the visitor is.
 * Matches without a time count as starting at 23:59 that day.
 */
export function matchStartMs(date: string, time: string | null): number {
  return sofiaLocalToDate(`${date}T${time?.trim() || "23:59"}`)?.getTime() ?? NaN;
}

/** "току-що", "преди 5 мин", "днес 21:14", "вчера 21:14", "20 ное 21:14" (Sofia time) */
export function formatActivityTime(date: Date, now: number = Date.now()): string {
  const diffMin = Math.floor((now - date.getTime()) / 60_000);
  if (diffMin < 1) return "току-що";
  if (diffMin < 60) return `преди ${diffMin} мин`;

  const day = (d: Date) => dateToSofiaLocal(d).slice(0, 10);
  const time = dateToSofiaLocal(date).slice(11, 16);
  if (day(date) === day(new Date(now))) return `днес ${time}`;
  if (day(date) === day(new Date(now - 86_400_000))) return `вчера ${time}`;
  const [, m, d] = day(date).split("-").map(Number);
  return `${d} ${monthShortBg(m - 1)} ${time}`;
}
