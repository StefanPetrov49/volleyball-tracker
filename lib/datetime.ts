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