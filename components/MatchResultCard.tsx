import Link from "next/link";
import TeamLogo from "@/components/TeamLogo";
import type { ResultWithTeams } from "@/lib/results";
import { formatSofia } from "@/lib/datetime";

type Props = {
  result: ResultWithTeams;
  detailed?: boolean;
};

export default function MatchResultCard({ result, detailed = false }: Props) {
  const finished = result.status === "finished";
  const teamAWon = finished && result.setsWonA > result.setsWonB;
  const teamBWon = finished && result.setsWonB > result.setsWonA;

  const card = (
    <article
      className={`result-card ${detailed ? "result-card-detailed" : ""} ${
        result.status === "live" ? "result-card-live" : ""
      }`}
    >
      {result.status === "live" && (
        <span className="result-badge result-badge-live">
          <span className="live-dot" aria-hidden="true" />
          НА ЖИВО
        </span>
      )}

      {result.status === "upcoming" && (
        <span className="result-badge result-badge-upcoming">
          Предстои · {formatSofia(result.playedAt)}
        </span>
      )}

      {result.status === "pending" && (
        <span className="result-badge result-badge-pending">
          Очаква се резултат
        </span>
      )}

      <div className="result-card-main">
        <div className={`result-team ${teamAWon ? "winner" : ""}`}>
          <TeamLogo
            src={result.teamA.logoUrl}
            alt={`${result.teamA.name} лого`}
            className="result-logo"
          />
          <span>{result.teamA.name}</span>
        </div>

        {finished ? (
          <span className="result-score">
            {result.setsWonA}-{result.setsWonB}
          </span>
        ) : (
          <span className="result-score result-score-vs">VS</span>
        )}

        <div className={`result-team ${teamBWon ? "winner" : ""}`}>
          <TeamLogo
            src={result.teamB.logoUrl}
            alt={`${result.teamB.name} лого`}
            className="result-logo"
          />
          <span>{result.teamB.name}</span>
        </div>
      </div>

      {result.sets.length > 0 && (
        <div className="result-sets">
          {result.sets.map((set, index) => (
            <span key={index} className="result-set-chip">
              {set.a}:{set.b}
            </span>
          ))}
        </div>
      )}

      {detailed && result.videoUrl && (
        <div className="result-video">
          <iframe
            src={result.videoUrl}
            title={`${result.teamA.name} vs ${result.teamB.name}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {!detailed && result.videoUrl && (
        <p className="result-video-hint">
          {result.status === "live" ? "▶ Гледай на живо" : "▶ Има видео"}
        </p>
      )}
    </article>
  );

  if (detailed) return card;

  return (
    <Link href={`/results/${result.id}`} className="result-card-link">
      {card}
    </Link>
  );
}