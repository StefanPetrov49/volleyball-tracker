import type { Match } from "@/types/match";
import MatchTile from "./MatchTile";
import { useState } from "react";
import { matchStartMs } from "@/lib/datetime";

const matchTime = (match: Match) => matchStartMs(match.date, match.time);

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