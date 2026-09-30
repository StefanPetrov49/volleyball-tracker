"use client";
import { useMemo, useState } from "react";
import type { Match } from "@/data/matches";

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];
const pad = (n: number) => String(n).padStart(2, "0");

export default function CalendarView({ matches }: { matches: Match[] }) {
  const first = matches.length ? new Date(matches[0].date) : new Date();
  const [year, setYear] = useState(first.getFullYear());
  const [month, setMonth] = useState(first.getMonth());

  const byDate = useMemo(() => {
    const map: Record<string, Match[]> = {};
    matches.forEach((m) => (map[m.date] ||= []).push(m));
    return map;
  }, [matches]);

  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const shift = (d: number) => {
    const nd = new Date(year, month + d, 1);
    setYear(nd.getFullYear());
    setMonth(nd.getMonth());
  };

  const todayKey = new Date().toISOString().slice(0, 10);

  return (
    <div className="calendar">
      <div className="cal-head">
        <button onClick={() => shift(-1)} aria-label="Previous month">‹</button>
        <h2>{new Date(year, month).toLocaleString("bg", { month: "long", year: "numeric" })}</h2>
        <button onClick={() => shift(1)} aria-label="Next month">›</button>
      </div>
      <div className="cal-grid">
        {DAYS.map((d) => <div key={d} className="cal-dow">{d}</div>)}
        {cells.map((day, i) => {
          const key = day ? `${year}-${pad(month + 1)}-${pad(day)}` : "";
          const ms = day ? byDate[key] ?? [] : [];
          return (
            <div key={i} className={`cal-cell ${day ? "" : "empty"} ${ms.length ? "has-match" : ""} ${key === todayKey ? "today" : ""}`}>
              {day && <span className="cal-day">{day}</span>}
              {ms.map((m) => (
                <div key={m.id} className="cal-event" title={`${m.location}`}>
                  {m.time} vs {m.opponent}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
