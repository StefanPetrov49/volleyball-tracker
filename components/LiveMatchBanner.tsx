"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type LiveMatch = {
  id: number;
  teamA: string;
  teamB: string;
  hasVideo: boolean;
};

const REFRESH_MS = 60_000;

export default function LiveMatchBanner() {
  const [matches, setMatches] = useState<LiveMatch[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch("/api/results/live", { cache: "no-store" });

        if (response.ok && !cancelled) {
          setMatches(await response.json());
        }
      } catch {
        // keep the previous state if the request fails
      }
    };

    load();
    const timer = setInterval(load, REFRESH_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  if (matches.length === 0) return null;

  return (
    <div className="live-banners">
      {matches.map((match) => (
        <Link
          key={match.id}
          href={`/results/${match.id}`}
          className="live-banner"
        >
          <span className="live-banner-badge">
            <span className="live-dot" aria-hidden="true" />
            НА ЖИВО
          </span>

          <span className="live-banner-title">
            {match.teamA} <small>vs</small> {match.teamB}
          </span>

          <span className="live-banner-cta">
            {match.hasVideo ? "Гледай ▶" : "Виж мача ▶"}
          </span>
        </Link>
      ))}
    </div>
  );
}