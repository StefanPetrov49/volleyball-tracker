import Image from "next/image";
import Link from "next/link";
import type { ResultWithTeams } from "@/lib/results";
import TeamLogo from "@/components/TeamLogo";

type Props = {
    result: ResultWithTeams;
    detailed?: boolean;
};


export default function MatchResultCard({ result, detailed = false }: Props) {
    const teamAWon = result.setsWonA > result.setsWonB;

    const card = (
        <article className={`result-card ${detailed ? "result-card-detailed" : ""}`}>
            <div className="result-card-main">
                <div className={`result-team ${teamAWon ? "winner" : ""}`}>
                    <TeamLogo
                        src={result.teamA.logoUrl}
                        alt={`${result.teamA.name} лого`}
                        className="result-logo"
                    />
                    <span>{result.teamA.name}</span>
                </div>

                <span className="result-score">
                    {result.setsWonA}-{result.setsWonB}
                </span>

                <div className={`result-team ${!teamAWon ? "winner" : ""}`}>
                    <TeamLogo
                        src={result.teamB.logoUrl}
                        alt={`${result.teamB.name} лого`}
                        className="result-logo"
                    />
                    <span>{result.teamB.name}</span>
                </div>
            </div>

            <div className="result-sets">
                {result.sets.map((set, index) => (
                    <span key={index} className="result-set-chip">
                        {set.a}:{set.b}
                    </span>
                ))}
            </div>

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
                <p className="result-video-hint">▶ Има видео</p>
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