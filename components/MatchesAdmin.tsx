"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Match } from "@/types/match";
import { parseMatchDate } from "@/lib/datetime";
import { toast } from "@/lib/toast";

const empty = { date: "", time: "", opponent: "", location: "", home: true };
const OTHER = "__other__"; // "Друг отбор…" option in the opponent dropdown

const fmt = (m: Match) => {
  const d = parseMatchDate(m.date).toLocaleDateString("bg-BG", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
  return m.time ? `${d}, ${m.time}` : d;
};

type Props = {
  upcoming: Match[]; // soonest first
  past: Match[]; // most recent first
  opponents: string[]; // team names from the database (without us)
};

export default function MatchesAdmin({ upcoming, past, opponents }: Props) {
  const router = useRouter();
  const [form, setForm] = useState(empty);
  // true when the opponent is typed by hand ("Друг отбор…"), e.g. a cup game vs a team not in the list
  const [customOpponent, setCustomOpponent] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof typeof empty>(field: K, value: (typeof empty)[K]) =>
    setForm((f) => ({ ...f, [field]: value }));

  const reset = () => {
    setForm(empty);
    setCustomOpponent(false);
    setEditingId(null);
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch(editingId ? `/api/matches/${editingId}` : "/api/matches", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, opponent: form.opponent.trim() }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Неуспешен запис. Провери полетата.");
      return;
    }
    toast(editingId ? "Промените по мача са запазени" : "Мачът е добавен");
    reset();
    router.refresh();
  };

  const edit = (m: Match) => {
    setEditingId(m.id);
    setForm({ date: m.date, time: m.time ?? "", opponent: m.opponent, location: m.location ?? "", home: m.home });
    // older matches may have a name that isn't in the list (e.g. "Инкредибалс")
    setCustomOpponent(!opponents.includes(m.opponent));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (m: Match) => {
    if (!window.confirm(`Изтриване на мача срещу ${m.opponent}?`)) return;
    const res = await fetch(`/api/matches/${m.id}`, { method: "DELETE" });
    if (res.ok) {
      toast("Мачът е изтрит");
      router.refresh();
    } else setError("Неуспешно изтриване.");
  };

  const selectValue = customOpponent ? OTHER : form.opponent;

  const card = (m: Match) => (
    <div key={m.id} className={`poll-card ${editingId === m.id ? "admin-card-editing" : ""}`}>
      <h4 className="poll-question">{m.home ? "Домакин" : "Гост"} · {m.opponent}</h4>
      <p>{fmt(m)}{m.location ? ` · 📍 ${m.location}` : ""}</p>
      <div className="poll-form-actions">
        <button className="poll-add-option-btn" onClick={() => edit(m)}>Редактирай</button>
        <button className="poll-add-option-btn" onClick={() => remove(m)}>Изтрий</button>
        {m.result ? (
          <Link className="poll-add-option-btn admin-result-link done" href={`/results/${m.result.id}/edit`}>
            {m.result.finished ? `Резултат ${m.result.us}:${m.result.them} ✓` : "Резултат ✓"}
          </Link>
        ) : (
          <Link className="poll-add-option-btn admin-result-link" href={`/results/new?matchId=${m.id}`}>
            + Резултат
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <section className="poll-section">
      <form className="poll-form" onSubmit={submit}>
        <h3>{editingId ? "Редакция на мач" : "Добави мач"}</h3>

        <div className="poll-form-field">
          <label htmlFor="opponent-select">Противник</label>
          <select
            id="opponent-select"
            className="admin-select"
            value={selectValue}
            onChange={(e) => {
              if (e.target.value === OTHER) {
                setCustomOpponent(true);
                set("opponent", "");
              } else {
                setCustomOpponent(false);
                set("opponent", e.target.value);
              }
            }}
            required
          >
            <option value="" disabled>Избери отбор</option>
            {opponents.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
            <option value={OTHER}>Друг отбор…</option>
          </select>
          {customOpponent && (
            <>
              <input
                value={form.opponent}
                onChange={(e) => set("opponent", e.target.value)}
                placeholder="Име на отбора"
                aria-label="Име на отбора"
                required
                maxLength={80}
                autoFocus={!editingId}
              />
              <small className="admin-hint">
                Ако отборът е в списъка, избери го оттам – така името е еднакво навсякъде.
              </small>
            </>
          )}
        </div>

        <div className="admin-row">
          <label className="admin-field">
            <span>Дата</span>
            <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} required />
          </label>
          <label className="admin-field">
            <span>Час</span>
            <input type="time" value={form.time} onChange={(e) => set("time", e.target.value)} />
          </label>
          <label className="admin-field admin-field-wide">
            <span>Зала</span>
            <input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="по желание" />
          </label>
        </div>

        <div className="poll-form-field">
          <label>
            <input type="checkbox" checked={form.home} onChange={(e) => set("home", e.target.checked)} /> Домакин
          </label>
        </div>
        {error && <p role="alert">{error}</p>}
        <div className="poll-form-actions">
          {editingId && (
            <button type="button" className="poll-add-option-btn" onClick={reset}>Откажи</button>
          )}
          <button type="submit" className="poll-submit-btn" disabled={busy}>
            {editingId ? "Запази" : "Добави мач"}
          </button>
        </div>
      </form>

      <h3 className="admin-list-title">Предстоящи ({upcoming.length})</h3>
      <div className="poll-cards">
        {upcoming.length > 0 ? upcoming.map(card) : <p className="admin-empty">Няма предстоящи мачове.</p>}
      </div>

      {past.length > 0 && (
        <>
          <div id="played" className="results-divider admin-divider" role="separator">
            <span>Изиграни ({past.length})</span>
          </div>
          <div className="poll-cards">{past.map(card)}</div>
        </>
      )}
    </section>
  );
}
