import type { Match } from "@/types/match";
import { sofiaLocalToDate } from "./datetime";

const TEAM = "Яките пичове";
const MATCH_DURATION_MS = 2 * 60 * 60 * 1000; // assume a match lasts ~2h

type EventRange =
  | { allDay: false; start: Date; end: Date }
  | { allDay: true; start: string; end: string }; // YYYYMMDD, end is exclusive

/** Match times are stored as Sofia local time; convert to real instants. */
function matchRange(match: Match): EventRange {
  const time = match.time?.trim();
  if (time) {
    const start = sofiaLocalToDate(`${match.date}T${time}`);
    if (start) {
      return { allDay: false, start, end: new Date(start.getTime() + MATCH_DURATION_MS) };
    }
  }
  // No time set → all-day event
  const [y, m, d] = match.date.split("-").map(Number);
  const nextDay = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
  return {
    allDay: true,
    start: match.date.replace(/-/g, ""),
    end: nextDay.replace(/-/g, ""),
  };
}

/** 2026-11-18T14:00:00.000Z → 20261118T140000Z */
const utcStamp = (d: Date) =>
  d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export const eventTitle = (match: Match) => `${TEAM} vs ${match.opponent}`;

const eventDescription = (match: Match) =>
  `Волейбол: ${TEAM} vs ${match.opponent} (${match.home ? "Домакини" : "Гости"})`;

/** Link that opens Google Calendar's "new event" form prefilled with the match. */
export function googleCalendarUrl(match: Match): string {
  const range = matchRange(match);
  const dates = range.allDay
    ? `${range.start}/${range.end}`
    : `${utcStamp(range.start)}/${utcStamp(range.end)}`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: eventTitle(match),
    dates,
    details: eventDescription(match),
    ctz: "Europe/Sofia",
  });
  const location = match.location?.trim();
  if (location) params.set("location", location);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// ---------- iCalendar (.ics) for Apple Calendar / Outlook ----------

const escapeText = (s: string) =>
  s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");

/** RFC 5545: lines longer than 75 octets must be folded (Cyrillic = 2 bytes/char). */
function foldLine(line: string): string {
  const encoder = new TextEncoder();
  const chunks: string[] = [];
  let current = "";
  let bytes = 0;
  let limit = 75;
  for (const ch of line) {
    const size = encoder.encode(ch).length;
    if (bytes + size > limit) {
      chunks.push(current);
      current = "";
      bytes = 0;
      limit = 74; // continuation lines start with a space
    }
    current += ch;
    bytes += size;
  }
  chunks.push(current);
  return chunks.join("\r\n ");
}

export function buildMatchIcs(match: Match): string {
  const range = matchRange(match);
  const location = match.location?.trim();

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Yakite Pichove//Volleyball Tracker//BG",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:match-${match.id}@yakite-pichove`,
    `DTSTAMP:${utcStamp(new Date())}`,
    ...(range.allDay
      ? [`DTSTART;VALUE=DATE:${range.start}`, `DTEND;VALUE=DATE:${range.end}`]
      : [`DTSTART:${utcStamp(range.start)}`, `DTEND:${utcStamp(range.end)}`]),
    `SUMMARY:${escapeText(eventTitle(match))}`,
    `DESCRIPTION:${escapeText(eventDescription(match))}`,
    ...(location ? [`LOCATION:${escapeText(location)}`] : []),
    ...(range.allDay
      ? []
      : [
          "BEGIN:VALARM",
          "ACTION:DISPLAY",
          `DESCRIPTION:${escapeText(eventTitle(match))}`,
          "TRIGGER:-PT1H",
          "END:VALARM",
        ]),
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.map(foldLine).join("\r\n") + "\r\n";
}

export const icsFileName = (match: Match) => `yakite-pichove-${match.date}.ics`;
