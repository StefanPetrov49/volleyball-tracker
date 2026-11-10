import type { Match } from "@/types/match";
import AddToCalendar from "./AddToCalendar";

type Props = {
  match: Match;
  /** when set, shows a × button (pinned popup) */
  onClose?: () => void;
  /** show the Google / Apple calendar buttons */
  showCalendarButtons?: boolean;
};

export default function MatchPopup({ match, onClose, showCalendarButtons = false }: Props) {
  const d = new Date(match.date);
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
          <span className="match-popup-month">{d.toLocaleString("en", { month: "short" })}</span>
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
        <li><span className="match-popup-icon">📍</span>{match.location?.trim() || "Няма зала"}</li>
      </ul>
      {showCalendarButtons && <AddToCalendar match={match} />}
    </div>
  );
}
