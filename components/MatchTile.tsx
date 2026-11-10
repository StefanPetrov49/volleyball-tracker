import type { Match } from "@/types/match";
import AddToCalendar from "./AddToCalendar";
import HallLink from "./HallLink";
import { monthShortBg, parseMatchDate } from "@/lib/datetime";

type Props = { match: Match; index: number; isNext: boolean; isPast: boolean };

export default function MatchTile({ match, index, isNext, isPast }: Props) {
  const d = parseMatchDate(match.date);
  return (
    <article
      className={`tile ${match.home ? "tile-home" : "tile-away"} ${isNext ? "tile-next" : ""} ${isPast ? "tile-past" : ""}`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {isNext && <span className="ribbon">СЛЕДВАЩ</span>}
      <div className="tile-date">
        <span className="tile-month">{monthShortBg(d.getMonth())}</span>
        <span className="tile-day">{d.getDate()}</span>
      </div>
      <div className="tile-body">
        <h3>vs {match.opponent}</h3>
        <p>🕒 {match.time?.trim() || "Няма час"}</p>
        <p>📍 <HallLink location={match.location} /></p>
        <span className={`badge ${match.home ? "home" : "away"}`}>{match.home ? "Домакини" : "Гости"}</span>
        {!isPast && <AddToCalendar match={match} />}
      </div>
    </article>
  );
}