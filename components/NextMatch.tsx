"use client";
import { useEffect, useState } from "react";
import type { Match } from "@/types/match";
import AddToCalendar from "./AddToCalendar";
import HallLink from "./HallLink";
import { parseMatchDate } from "@/lib/datetime";

const toDate = (m: Match) => new Date(`${m.date}T${m.time?.trim() || "23:59"}`);

export default function NextMatch({ matches }: { matches: Match[] }) {
    const [now, setNow] = useState<number | null>(null);

    useEffect(() => {
        const first = setTimeout(() => setNow(Date.now()), 0);
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => {
            clearTimeout(first);
            clearInterval(t);
        };
    }, []);

    if (now === null) return <div className="next" style={{ minHeight: 140 }} />;

    const next = [...matches]
        .sort((a, b) => toDate(a).getTime() - toDate(b).getTime())
        .find((m) => toDate(m).getTime() > now);

    if (!next) {
        return (
            <div className="next">
                <p className="next-label">Следващ мач</p>
                <h2>Няма насрочени мачове 🏐</h2>
                <p className="next-meta">Новите мачове ще се появят тук веднага щом бъдат добавени.</p>
            </div>
        );
    }

    const diff = toDate(next).getTime() - now;

    // "ср, 11 ноември · 21:00 · Зала Кракра · Гости" – never shows empty gaps
    const dateLabel = parseMatchDate(next.date).toLocaleDateString("bg-BG", {
        weekday: "short",
        day: "numeric",
        month: "long",
    });
    const parts = [
        ["дни", Math.floor(diff / 86400000)],
        ["часове", Math.floor(diff / 3600000) % 24],
        ["минути", Math.floor(diff / 60000) % 60],
        ["секунди", Math.floor(diff / 1000) % 60],
    ] as const;

    return (
        <div className="next">
            <p className="next-label">Следващ мач</p>
            <h2>vs {next.opponent}</h2>
            <p className="next-meta">
                {dateLabel} · {next.time?.trim() || "Няма час"} · <HallLink location={next.location} /> ·{" "}
                {next.home ? "Домакини" : "Гости"}
            </p>
            <div className="countdown">
                {parts.map(([label, value]) => (
                    <div key={label} className="count-box">
                        <span>{String(value).padStart(2, "0")}</span>
                        <small>{label}</small>
                    </div>
                ))}
            </div>
            <AddToCalendar match={next} variant="dark" />
        </div>
    );
}