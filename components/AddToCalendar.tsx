import type { Match } from "@/types/match";
import { googleCalendarUrl } from "@/lib/calendar-export";

type Props = {
  match: Match;
  /** "dark" for the next-match card, "light" for white tiles */
  variant?: "light" | "dark";
};

export default function AddToCalendar({ match, variant = "light" }: Props) {
  return (
    <div className={`add-cal add-cal-${variant}`}>
      <a
        className="add-cal-btn"
        href={googleCalendarUrl(match)}
        target="_blank"
        rel="noopener noreferrer"
        title="Добави в Google Календар"
      >
        ＋ Google Календар
      </a>
      <a
        className="add-cal-btn"
        href={`/api/matches/${match.id}/calendar`}
        title="Изтегли .ics файл (Apple Календар, Outlook)"
      >
        ＋ Apple Календар
      </a>
    </div>
  );
}
