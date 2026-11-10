"use client";
import { useEffect, useState } from "react";
import {
  normalizeName,
  OUR_TEAM_NAME,
  STANDINGS_SOURCE_URL as SOURCE_URL,
  type Standings,
} from "@/lib/standings";

type State =
  | { status: "loading" }
  | { status: "ok"; data: Standings }
  | { status: "error"; message: string };

const isOurs = (team: string) => normalizeName(team) === normalizeName(OUR_TEAM_NAME);

/** '"А" дивизия - Група C' → '„А“ дивизия – Група C' */
const prettyGroup = (g: string) => g.replace(/"([^"]+)"/, "„$1“").replace(" - ", " – ");

async function fetchStandings(): Promise<State> {
  try {
    const res = await fetch("/api/standings", { cache: "no-store" });
    const body = await res.json();
    if (!res.ok) return { status: "error", message: body.error ?? "Класирането не може да се зареди в момента." };
    return { status: "ok", data: body as Standings };
  } catch {
    return { status: "error", message: "Няма връзка. Провери интернета и опитай пак." };
  }
}

/**
 * "Класиране" tab: our group's table from volleymania.com, loaded when the tab opens.
 * (volleymania is fetched by our server at most every 10 minutes.)
 */
export default function LeagueStandings() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let active = true;
    fetchStandings().then((s) => active && setState(s));
    return () => {
      active = false;
    };
  }, []);

  const retry = () => {
    setState({ status: "loading" });
    fetchStandings().then(setState);
  };

  if (state.status === "loading") {
    return <div className="standings-card standings-loading" aria-busy="true">Зареждане на класирането…</div>;
  }

  if (state.status === "error") {
    return (
      <div className="standings-card standings-error" role="alert">
        <p>{state.message}</p>
        <div className="standings-error-actions">
          <button type="button" className="results-add-button" onClick={retry}>
            Опитай пак
          </button>
          <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer">
            Виж го в volleymania.com ↗
          </a>
        </div>
      </div>
    );
  }

  const { data } = state;
  return (
    <div className="standings-card">
      <h2 className="standings-title">{prettyGroup(data.group)}</h2>

      <div className="standings-scroll">
        <table className="standings-table">
          <thead>
            <tr>
              <th title="Място">#</th>
              <th className="st-team">Отбор</th>
              <th title="Мачове">М</th>
              <th title="Победи">П</th>
              <th title="Загуби">З</th>
              <th title="Геймове">Г</th>
              <th className="st-wide" title="Геймово съотношение">ГС</th>
              <th className="st-wide" title="Точкова разлика">ТР</th>
              <th className="st-wide" title="Точково съотношение">ТС</th>
              <th title="Точки (вкл. точки купа)">Т</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <tr key={r.rank} className={isOurs(r.team) ? "st-ours" : undefined}>
                <td>{r.rank}</td>
                <td className="st-team">{r.team}</td>
                <td>{r.played}</td>
                <td>{r.won}</td>
                <td>{r.lost}</td>
                <td>{r.sets}</td>
                <td className="st-wide">{r.setRatio}</td>
                <td className="st-wide">{r.pointsDiff}</td>
                <td className="st-wide">{r.pointsRatio}</td>
                <td className="st-points">{r.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="standings-source">
        Обновено{" "}
        {new Date(data.updatedAt).toLocaleTimeString("bg-BG", {
          timeZone: "Europe/Sofia",
          hour: "2-digit",
          minute: "2-digit",
        })}{" "}
        · Източник:{" "}
        <a href={data.sourceUrl} target="_blank" rel="noopener noreferrer">
          volleymania.com ↗
        </a>
      </p>
    </div>
  );
}
