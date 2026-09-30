"use client";
import { useState } from "react";
import type { Match } from "@/data/matches";
import CalendarView from "./CalendarView";
import TilesView from "./TilesView";
import PollSection from "./PollSection";

export default function Schedule({ matches }: { matches: Match[] }) {
  const [view, setView] = useState<"calendar" | "tiles" | "polls">("calendar");
  return (
    <section>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={view === "calendar"} className={view === "calendar" ? "active" : ""} onClick={() => setView("calendar")}>Календар</button>
        <button role="tab" aria-selected={view === "tiles"} className={view === "tiles" ? "active" : ""} onClick={() => setView("tiles")}>График</button>
        <button role="tab" aria-selected={view === "polls"} className={view === "polls" ? "active" : ""} onClick={() => setView("polls")}>Анкети</button>
      </div>
      {view === "calendar" && <CalendarView matches={matches} />}
      {view === "tiles" && <TilesView matches={matches} />}
      {view === "polls" && <PollSection />}
    </section>
  );
}
