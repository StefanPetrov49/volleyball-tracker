"use client";
import { useMemo, useState } from "react";
import type { Match } from "@/types/match";
import CalendarEventWithPopup from "./CalendarEventWithPopup";
import { nowSofiaLocal } from "@/lib/datetime";

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];
const pad = (n: number) => String(n).padStart(2, "0");

export default function CalendarView({ matches }: { matches: Match[] }) {
  // Today's date in Sofia time ("YYYY-MM-DD"), so server render and browser agree
  const todayKey = nowSofiaLocal().slice(0, 10);
  // Always open on the current month
  const [year, setYear] = useState(() => Number(todayKey.slice(0, 4)));
  const [month, setMonth] = useState(() => Number(todayKey.slice(5, 7)) - 1);

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

  const todayYear = Number(todayKey.slice(0, 4));
  const todayMonth = Number(todayKey.slice(5, 7)) - 1;
  const onCurrentMonth = year === todayYear && month === todayMonth;
  const goToday = () => {
    setYear(todayYear);
    setMonth(todayMonth);
  };

  const shift = (d: number) => {
    const nd = new Date(year, month + d, 1);
    setYear(nd.getFullYear());
    setMonth(nd.getMonth());
  };

  return (
    <div className="calendar">
      <div className="cal-head">
        <button onClick={() => shift(-1)} aria-label="Предишен месец">‹</button>
        <div className="cal-title">
          <h2>{new Date(year, month).toLocaleString("bg", { month: "long", year: "numeric" })}</h2>
          {!onCurrentMonth && (
            <button type="button" className="cal-today-btn" onClick={goToday}>
              Днес
            </button>
          )}
        </div>
        <button onClick={() => shift(1)} aria-label="Следващ месец">›</button>
      </div>
      <div className="cal-grid">
        {DAYS.map((d) => <div key={d} className="cal-dow">{d}</div>)}
        {cells.map((day, i) => {
          const key = day ? `${year}-${pad(month + 1)}-${pad(day)}` : "";
          const ms = day ? byDate[key] ?? [] : [];
          const past = day !== null && key < todayKey; // "YYYY-MM-DD" strings compare by date
          return (
            <div key={i} className={`cal-cell ${day ? "" : "empty"} ${ms.length ? "has-match" : ""} ${past ? "past" : ""} ${key === todayKey ? "today" : ""}`}>
              {day && <span className="cal-day">{day}</span>}
              {ms.map((m) => (
                <CalendarEventWithPopup key={m.id} match={m} past={past} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

