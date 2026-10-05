"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Match } from "@/types/match";

const empty = { date: "", time: "", opponent: "", location: "", home: true };

const fmt = (m: Match) => {
  const d = new Date(m.date).toLocaleDateString("bg-BG", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
  return m.time ? `${d}, ${m.time}` : d;
};

export default function MatchesAdmin({ matches }: { matches: Match[] }) {
  const router = useRouter();
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof typeof empty>(field: K, value: (typeof empty)[K]) =>
    setForm((f) => ({ ...f, [field]: value }));

  const reset = () => {
    setForm(empty);
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
      body: JSON.stringify(form),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Неуспешен запис. Провери полетата.");
      return;
    }
    reset();
    router.refresh();
  };

  const edit = (m: Match) => {
    setEditingId(m.id);
    setForm({ date: m.date, time: m.time ?? "", opponent: m.opponent, location: m.location ?? "", home: m.home });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (m: Match) => {
    if (!window.confirm(`Изтриване на мача срещу ${m.opponent}?`)) return;
    const res = await fetch(`/api/matches/${m.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else setError("Неуспешно изтриване.");
  };

  return (
    <section className="poll-section">
      <form className="poll-form" onSubmit={submit}>
        <h3>{editingId ? "Редакция на мач" : "Добави мач"}</h3>
        <div className="poll-form-field">
          <label>Противник</label>
          <input value={form.opponent} onChange={(e) => set("opponent", e.target.value)} required maxLength={80} />
        </div>
        <div className="poll-option-row">
          <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} required />
          <input type="time" value={form.time} onChange={(e) => set("time", e.target.value)} />
          <input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Зала (по желание)" />
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

      <div className="poll-cards">
        {matches.map((m) => (
          <div key={m.id} className="poll-card">
            <h4 className="poll-question">{m.home ? "Домакин" : "Гост"} · {m.opponent}</h4>
            <p>{fmt(m)}{m.location ? ` · 📍 ${m.location}` : ""}</p>
            <div className="poll-form-actions">
              <button className="poll-add-option-btn" onClick={() => edit(m)}>Редактирай</button>
              <button className="poll-add-option-btn" onClick={() => remove(m)}>Изтрий</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}