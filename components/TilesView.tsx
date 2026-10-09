import type { Match } from "@/types/match";
import MatchTile from "./MatchTile";
import { useState } from "react";

const matchTime = (match: Match) =>
  new Date(
    `${match.date}T${match.time?.trim() || "23:59"}`,
  ).getTime();

export default function TilesView({ matches }: { matches: Match[] }) {
  const [now] = useState(() => Date.now());

  const upcomingMatches = matches
    .filter((match) => matchTime(match) >= now)
    .sort((a, b) => matchTime(a) - matchTime(b));

  const nextId = upcomingMatches[0]?.id;

  return (
    <div className="tiles">
      {upcomingMatches.map((match, index) => (
        <MatchTile
          key={match.id}
          match={match}
          index={index}
          isNext={match.id === nextId}
          isPast={false}
        />
      ))}
    </div>
  );
}