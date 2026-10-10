"use client";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import type { Match } from "@/types/match";
import CalendarView from "./CalendarView";
import TilesView from "./TilesView";
import PollSection from "./PollSection";

export default function Schedule({ matches: initial }: { matches: Match[] }) {
  const [view, setView] = useState<"calendar" | "tiles" | "polls">("calendar");
  const [matches, setMatches] = useState<Match[]>(initial);

  const refreshMatches = useCallback(() => {
    fetch("/api/matches")
      .then((r) => r.json())
      .then((data: Match[]) => setMatches(data));
  }, []);

  useEffect(() => {
    if (view === "calendar" || view === "tiles") {
      refreshMatches();
    }
  }, [view, refreshMatches]);

  return (
    <section>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={view === "calendar"} className={view === "calendar" ? "active" : ""} onClick={() => setView("calendar")}>Календар</button>
        <button role="tab" aria-selected={view === "tiles"} className={view === "tiles" ? "active" : ""} onClick={() => setView("tiles")}>График</button>
        <button role="tab" aria-selected={view === "polls"} className={view === "polls" ? "active" : ""} onClick={() => setView("polls")}>Анкети</button>
        <Link href="/results" className="tab-link">
          Резултати
        </Link>
      </div>
      {view === "calendar" && <CalendarView matches={matches} />}
      {view === "tiles" && <TilesView matches={matches} />}
      {view === "polls" && <PollSection />}
    </section>
  );
}

