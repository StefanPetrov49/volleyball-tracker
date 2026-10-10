"use client";

import { useActionState, useState } from "react";
import { createMatchResult, type ResultFormState } from "./actions";
import type { Team } from "@/lib/teams";

const initialState: ResultFormState = {};
const SET_COUNT = 5;

type SetInput = { a: string; b: string };

export default function ResultForm({ teams }: { teams: Team[] }) {
  const [state, formAction, pending] = useActionState(
    createMatchResult,
    initialState,
  );

  const [teamAId, setTeamAId] = useState("");
  const [teamBId, setTeamBId] = useState("");
  const [sets, setSets] = useState<SetInput[]>(
    Array.from({ length: SET_COUNT }, () => ({ a: "", b: "" })),
  );

  const nameOf = (id: string) =>
    teams.find((t) => String(t.id) === id)?.name ?? "";

  const updateSet = (index: number, side: "a" | "b", value: string) => {
    setSets((current) =>
      current.map((s, i) => (i === index ? { ...s, [side]: value } : s)),
    );
  };

  const played = sets.filter((s) => s.a !== "" && s.b !== "");
  const wonA = played.filter((s) => Number(s.a) > Number(s.b)).length;
  const wonB = played.filter((s) => Number(s.b) > Number(s.a)).length;

  const nameA = nameOf(teamAId) || "Отбор A";
  const nameB = nameOf(teamBId) || "Отбор B";

  return (
    <form action={formAction} className="result-form">
      <section className="result-step">
        <h2 className="result-step-title">
          <span className="result-step-num">1</span> Отбори
        </h2>

        <div className="result-teams">
          <label className="result-field">
            <span>Отбор A</span>
            <select
              name="teamAId"
              value={teamAId}
              onChange={(e) => setTeamAId(e.target.value)}
              required
            >
              <option value="" disabled>Избери отбор</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id} disabled={String(t.id) === teamBId}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>

          <span className="result-vs">VS</span>

          <label className="result-field">
            <span>Отбор B</span>
            <select
              name="teamBId"
              value={teamBId}
              onChange={(e) => setTeamBId(e.target.value)}
              required
            >
              <option value="" disabled>Избери отбор</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id} disabled={String(t.id) === teamAId}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="result-step">
        <h2 className="result-step-title">
          <span className="result-step-num">2</span> Резултати по сетове
        </h2>

        <div className="result-sets-table">
          <div className="result-sets-head">
            <span />
            <span>{nameA}</span>
            <span />
            <span>{nameB}</span>
          </div>

          {sets.map((s, i) => {
            const filled = s.a !== "" && s.b !== "";
            const aWins = filled && Number(s.a) > Number(s.b);
            const bWins = filled && Number(s.b) > Number(s.a);

            return (
              <div key={i} className="result-set-row">
                <span className="result-set-label">
                  Сет {i + 1}
                  {i >= 3 && <small>по желание</small>}
                </span>

                <input
                  name={`set${i + 1}A`}
                  type="number"
                  min={0}
                  inputMode="numeric"
                  placeholder="25"
                  value={s.a}
                  onChange={(e) => updateSet(i, "a", e.target.value)}
                  className={aWins ? "set-win" : ""}
                  aria-label={`Сет ${i + 1}, ${nameA}`}
                />

                <span className="result-set-colon">:</span>

                <input
                  name={`set${i + 1}B`}
                  type="number"
                  min={0}
                  inputMode="numeric"
                  placeholder="22"
                  value={s.b}
                  onChange={(e) => updateSet(i, "b", e.target.value)}
                  className={bWins ? "set-win" : ""}
                  aria-label={`Сет ${i + 1}, ${nameB}`}
                />
              </div>
            );
          })}
        </div>

        <div className="result-preview">
          <span>Краен резултат</span>
          <strong>{wonA} - {wonB}</strong>
        </div>
      </section>

      <section className="result-step">
        <h2 className="result-step-title">
          <span className="result-step-num">3</span> Дата и видео
        </h2>

        <label className="result-field">
          <span>Дата и час на мача</span>
          <input name="playedAt" type="datetime-local" />
        </label>

        <label className="result-field">
          <span>YouTube линк <small>(по желание)</small></span>
          <input
            name="videoUrl"
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
          />
          <small className="result-hint">
            Копирай линка от YouTube както си е, ще го преобразуваме автоматично.
          </small>
        </label>
      </section>

      {state.error && (
        <p className="result-error" role="alert">{state.error}</p>
      )}

      <button type="submit" className="result-submit" disabled={pending}>
        {pending ? "Запазване..." : "Запази резултата"}
      </button>
    </form>
  );
}