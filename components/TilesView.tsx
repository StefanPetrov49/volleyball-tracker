import type { Match } from "@/types/match";
import MatchTile from "./MatchTile";
import { useState } from "react";

export default function TilesView({ matches }: { matches: Match[] }) {
  const sorted = [...matches].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const [now] = useState(() => Date.now());
  const nextId = sorted.find((m) => new Date(`${m.date}T${m.time?.trim() || "23:59"}`).getTime() > now)?.id;
  return (
    <div className="tiles">
      {sorted.map((m, i) => (
        <MatchTile
          key={m.id}
          match={m}
          index={i}
          isNext={m.id === nextId}
          isPast={new Date(`${m.date}T${m.time?.trim() || "23:59"}`).getTime() < now}
        />
      ))}
    </div>
  );
}