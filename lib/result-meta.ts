import type { ResultWithTeams } from "@/lib/results";

const TZ = "Europe/Sofia";

/** "18 октомври 2026, 16:00" in Sofia time */
export function formatResultDate(date: Date): string {
  const day = date.toLocaleDateString("bg-BG", {
    timeZone: TZ,
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const time = date.toLocaleTimeString("bg-BG", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${day.replace(/\s*г\.$/, "")}, ${time}`;
}

export const STATUS_LABEL: Record<ResultWithTeams["status"], string> = {
  finished: "Резултат",
  upcoming: "Предстоящ мач",
  live: "На живо",
  pending: "Очаква се резултат",
};

/** "Яките пичове 3:1 Легендите" or "Яките пичове vs Легендите" */
export function resultTitle(r: ResultWithTeams): string {
  return r.status === "finished"
    ? `${r.teamA.name} ${r.setsWonA}:${r.setsWonB} ${r.teamB.name}`
    : `${r.teamA.name} vs ${r.teamB.name}`;
}

export function resultDescription(r: ResultWithTeams): string {
  const date = formatResultDate(r.playedAt);
  switch (r.status) {
    case "finished": {
      const sets = r.sets.map((s) => `${s.a}:${s.b}`).join(", ");
      return `Краен резултат ${r.setsWonA}:${r.setsWonB} (${sets}) · ${date}`;
    }
    case "upcoming":
      return `Предстоящ мач · ${date}. Ела да ни подкрепиш!`;
    case "live":
      return `Мачът тече в момента${r.videoUrl ? " – гледай на живо" : ""} · ${date}`;
    case "pending":
      return `Мачът е изигран, резултатът предстои · ${date}`;
  }
}
