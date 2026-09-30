"use client";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Match } from "@/data/matches";
import MatchPopup from "./MatchPopup";

export default function CalendarEventWithPopup({ match }: { match: Match }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const show = () => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({
      top: r.top + window.scrollY - 8,
      left: r.left + r.width / 2 + window.scrollX,
    });
  };

  const hide = () => setPos(null);

  return (
    <>
      <div
        ref={ref}
        className="cal-event"
        onMouseEnter={show}
        onMouseLeave={hide}
      >
        {match.time} vs {match.opponent}
      </div>
      {pos &&
        createPortal(
          <div
            style={{
              position: "absolute",
              top: pos.top,
              left: pos.left,
              transform: "translate(-50%, -100%)",
              zIndex: 9999,
              pointerEvents: "none",
            }}
          >
            <MatchPopup match={match} />
          </div>,
          document.body
        )}
    </>
  );
}
