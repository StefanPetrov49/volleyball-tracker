import Link from "next/link";
import type { ActivityRow } from "@/lib/services/activity";
import { formatActivityTime } from "@/lib/datetime";

/** "Последни промени" rows: "Йордан Терзиев добави мач vs Чуковете · 20 ное" + time */
export default function ActivityList({ rows }: { rows: ActivityRow[] }) {
  if (rows.length === 0) {
    return <p className="activity-empty">Все още няма записани промени.</p>;
  }
  return (
    <ul className="activity-list">
      {rows.map((r) => {
        const text = (
          <>
            <span className="activity-text">
              <strong>{r.actorName}</strong> {r.summary}
            </span>
            <span className="activity-time">{formatActivityTime(r.createdAt)}</span>
          </>
        );
        return (
          <li key={r.id}>
            {r.href ? (
              <Link href={r.href} className="activity-row">
                {text}
              </Link>
            ) : (
              <div className="activity-row">{text}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
