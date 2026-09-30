"use client";
import { useState } from "react";
import type { Match } from "@/data/matches";
import CalendarView from "./CalendarView";
import TilesView from "./TilesView";

export default function Schedule({ matches }: { matches: Match[] }) {
  const [view, setView] = useState<"calendar" | "tiles">("calendar");
  return (
    <section>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={view === "calendar"} className={view === "calendar" ? "active" : ""} onClick={() => setView("calendar")}>Calendar</button>
        <button role="tab" aria-selected={view === "tiles"} className={view === "tiles" ? "active" : ""} onClick={() => setView("tiles")}>Tiles</button>
      </div>
      {view === "calendar" ? <CalendarView matches={matches} /> : <TilesView matches={matches} />}
    </section>
  );
}
