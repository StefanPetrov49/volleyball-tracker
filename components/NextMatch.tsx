"use client";
import { useEffect, useState } from "react";
import type { Match } from "@/data/matches";

const toDate = (m: Match) => new Date(`${m.date}T${m.time}`);

export default function NextMatch({ matches }: { matches: Match[] }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (now === null) return <div className="next" style={{ minHeight: 140 }} />;

  const next = [...matches]
    .sort((a, b) => toDate(a).getTime() - toDate(b).getTime())
    .find((m) => toDate(m).getTime() > now);

  if (!next) return <div className="next"><h2>Season complete 🏆</h2></div>;

  const diff = toDate(next).getTime() - now;
  const parts = [
    ["days", Math.floor(diff / 86400000)],
    ["hrs", Math.floor(diff / 3600000) % 24],
    ["min", Math.floor(diff / 60000) % 60],
    ["sec", Math.floor(diff / 1000) % 60],
  ] as const;

  return (
    <div className="next">
      <p className="next-label">Next match</p>
      <h2>vs {next.opponent}</h2>
      <p className="next-meta">{next.time} · {next.location} · {next.home ? "Home" : "Away"}</p>
      <div className="countdown">
        {parts.map(([label, value]) => (
          <div key={label} className="count-box">
            <span>{String(value).padStart(2, "0")}</span>
            <small>{label}</small>
          </div>
        ))}
      </div>
    </div>
  );
}