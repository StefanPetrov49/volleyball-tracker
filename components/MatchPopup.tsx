import Link from "next/link";
import type { Match } from "@/types/match";
import AddToCalendar from "./AddToCalendar";
import HallLink from "./HallLink";
import { monthShortBg, parseMatchDate } from "@/lib/datetime";

type Props = {
  match: Match;
  /** when set, shows a × button (pinned popup) */
  onClose?: () => void;
  /** show the Google / Apple calendar buttons */
  showCalendarButtons?: boolean;
};

export default function MatchPopup({ match, onClose, showCalendarButtons = false }: Props) {
  const d = parseMatchDate(match.date);
  const fullDate = d.toLocaleDateString("bg-BG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className={`match-popup ${onClose ? "match-popup-pinned" : ""}`}>
      {onClose && (
        <button type="button" className="match-popup-close" onClick={onClose} aria-label="Затвори">
          ×
        </button>
      )}
      <div className="match-popup-header">
        <div className="match-popup-date-block">
          <span className="match-popup-month">{monthShortBg(d.getMonth())}</span>
          <span className="match-popup-day">{d.getDate()}</span>
        </div>
        <div className="match-popup-title">
          <h4>vs {match.opponent}</h4>
          <span className={`badge ${match.home ? "home" : "away"}`}>
            {match.home ? "Домакини" : "Гости"}
          </span>
        </div>
      </div>
      <div className="match-popup-divider" />
      <ul className="match-popup-details">
        <li><span className="match-popup-icon">📅</span>{fullDate}</li>
        <li><span className="match-popup-icon">🕒</span>{match.time?.trim() || "Няма час"}</li>
        <li><span className="match-popup-icon">📍</span><HallLink location={match.location} /></li>
      </ul>
      {match.result?.finished && (
        <div className={`match-popup-result ${match.result.us > match.result.them ? "win" : "loss"}`}>
          <span className="match-popup-score">
            {match.result.us}:{match.result.them}
            <small>{match.result.us > match.result.them ? "Победа" : "Загуба"}</small>
          </span>
          <span className="match-popup-sets">
            {match.result.sets.map((s) => `${s.us}:${s.them}`).join(" · ")}
          </span>
        </div>
      )}
      {onClose && match.result && (
        <Link className="match-popup-link" href={`/results/${match.result.id}`}>
          {match.result.finished ? "Виж мача" : "Към страницата на мача"} →
        </Link>
      )}
      {showCalendarButtons && <AddToCalendar match={match} />}
    </div>
  );
}
