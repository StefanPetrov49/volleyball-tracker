import type { Match } from "@/data/matches";

type Props = { match: Match; index: number; isNext: boolean; isPast: boolean };

export default function MatchTile({ match, index, isNext, isPast }: Props) {
  const d = new Date(match.date);
  return (
    <article
      className={`tile ${match.home ? "tile-home" : "tile-away"} ${isNext ? "tile-next" : ""} ${isPast ? "tile-past" : ""}`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {isNext && <span className="ribbon">NEXT UP</span>}
      <div className="tile-date">
        <span className="tile-month">{d.toLocaleString("en", { month: "short" })}</span>
        <span className="tile-day">{d.getDate()}</span>
      </div>
      <div className="tile-body">
        <h3>vs {match.opponent}</h3>
        <p>🕒 {match.time}</p>
        <p>📍 {match.location}</p>
        <span className={`badge ${match.home ? "home" : "away"}`}>{match.home ? "Home" : "Away"}</span>
      </div>
    </article>
  );
}