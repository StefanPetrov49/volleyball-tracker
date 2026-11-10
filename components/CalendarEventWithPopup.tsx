"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Match } from "@/types/match";
import MatchPopup from "./MatchPopup";

const POPUP_WIDTH = 280; // px; the popup never gets wider than the screen minus EDGE*2
const EDGE = 8; // min distance from the screen edge
const GAP = 8; // distance between the event and the popup
const ROOM_ABOVE = 300; // if less space than this above the event, open below

type Pos = { top: number; left: number; below: boolean };

const isUpcoming = (m: Match) =>
  new Date(`${m.date}T${m.time?.trim() || "23:59"}`).getTime() > Date.now();

/**
 * Calendar event chip.
 * - Mouse hover: quick preview (not clickable).
 * - Click / tap / Enter: opens a pinned popup with add-to-calendar buttons.
 *   Closes on outside tap, Escape, the × button, or tapping the event again.
 */
export default function CalendarEventWithPopup({ match }: { match: Match }) {
  const [pos, setPos] = useState<Pos | null>(null);
  const [pinned, setPinned] = useState(false);
  const [upcoming, setUpcoming] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const openedByKeyboard = useRef(false);

  const measure = useCallback((): Pos | null => {
    const el = triggerRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const half = Math.min(POPUP_WIDTH, vw - EDGE * 2) / 2;
    // keep the popup fully on screen (e.g. Sunday column on phones)
    const center = Math.min(Math.max(r.left + r.width / 2, half + EDGE), vw - half - EDGE);
    const below = r.top < ROOM_ABOVE;
    return {
      left: center + window.scrollX,
      top: (below ? r.bottom + GAP : r.top - GAP) + window.scrollY,
      below,
    };
  }, []);

  const close = useCallback(() => {
    setPinned(false);
    setPos(null);
  }, []);

  const onClick = (e: React.MouseEvent) => {
    if (pinned) return close();
    openedByKeyboard.current = e.detail === 0; // Enter/Space → detail 0
    setUpcoming(isUpcoming(match));
    setPos(measure());
    setPinned(true);
  };

  // Hover preview for mouse only, so taps on phones go straight to the pinned popup
  const onPointerEnter = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && !pinned) setPos(measure());
  };
  const onPointerLeave = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && !pinned) setPos(null);
  };

  useEffect(() => {
    if (!pinned) return;

    if (openedByKeyboard.current) {
      popupRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    }

    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (popupRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        triggerRef.current?.focus();
      }
    };
    const onResize = () => setPos(measure());

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [pinned, close, measure]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="cal-event"
        onClick={onClick}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        aria-haspopup="dialog"
        aria-expanded={pinned}
      >
        {match.time ? `${match.time} ` : ""}vs {match.opponent}
      </button>
      {pos &&
        createPortal(
          <div
            ref={popupRef}
            role={pinned ? "dialog" : undefined}
            aria-label={pinned ? `Мач срещу ${match.opponent}` : undefined}
            style={{
              position: "absolute",
              top: pos.top,
              left: pos.left,
              width: `min(${POPUP_WIDTH}px, calc(100vw - ${EDGE * 2}px))`,
              transform: `translate(-50%, ${pos.below ? "0" : "-100%"})`,
              zIndex: 9999,
              pointerEvents: pinned ? "auto" : "none",
            }}
          >
            <MatchPopup
              match={match}
              onClose={pinned ? close : undefined}
              showCalendarButtons={pinned && upcoming}
            />
          </div>,
          document.body,
        )}
    </>
  );
}
