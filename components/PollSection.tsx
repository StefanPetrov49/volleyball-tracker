"use client";
import { useEffect, useState } from "react";
import type { Poll } from "@/types/poll";
import { useAuth } from "@/lib/AuthContext";

const fmt = (date: string, time?: string) => {
  const d = new Date(date);
  const dateStr = d.toLocaleDateString("bg-BG", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
  return time ? `${dateStr}, ${time}` : dateStr;
};

function CreatePollForm({ onCreated }: { onCreated: () => void }) {
  const [question, setQuestion] = useState("Кога играем?");
  const [options, setOptions] = useState([
    { date: "", time: "", location: "" },
    { date: "", time: "", location: "" },
  ]);

  const setOption = (i: number, field: string, value: string) =>
    setOptions((prev) => prev.map((o, idx) => idx === i ? { ...o, [field]: value } : o));

  const addOption = () => setOptions((prev) => [...prev, { date: "", time: "", location: "" }]);
  const removeOption = (i: number) => setOptions((prev) => prev.filter((_, idx) => idx !== i));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const filled = options.filter((o) => o.date);
    if (filled.length < 2) return;
    const res = await fetch("/api/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, options: filled }),
    });
    if (!res.ok) return;
    onCreated();
    setQuestion("Кога играем?");
    setOptions([{ date: "", time: "", location: "" }, { date: "", time: "", location: "" }]);
  };

  return (
    <form className="poll-form" onSubmit={submit}>
      <h3>Нова анкета</h3>
      <div className="poll-form-field">
        <label>Въпрос</label>
        <input value={question} onChange={(e) => setQuestion(e.target.value)} required />
      </div>
      <div className="poll-options-list">
        {options.map((o, i) => (
          <div key={i} className="poll-option-row">
            <span className="poll-option-num">{i + 1}</span>
            <input type="date" value={o.date} onChange={(e) => setOption(i, "date", e.target.value)} required placeholder="Дата" />
            <input type="time" value={o.time} onChange={(e) => setOption(i, "time", e.target.value)} placeholder="Час" />
            <input value={o.location} onChange={(e) => setOption(i, "location", e.target.value)} placeholder="Зала (по желание)" />
            {options.length > 2 && (
              <button type="button" className="poll-remove-btn" onClick={() => removeOption(i)} aria-label="Премахни">✕</button>
            )}
          </div>
        ))}
      </div>
      <div className="poll-form-actions">
        <button type="button" className="poll-add-option-btn" onClick={addOption}>+ Добави вариант</button>
        <button type="submit" className="poll-submit-btn">Създай анкета</button>
      </div>
    </form>
  );
}

function PollCard({ poll, onChanged }: { poll: Poll; onChanged: () => void }) {
  const notVoted = poll.notVoted ?? [];
  const hasVoted = poll.myVotes.length > 0;
  const totalVotes = poll.options.reduce((s, o) => s + o.votes, 0);
  const maxVotes = Math.max(...poll.options.map((o) => o.votes));

  const toggle = async (optionId: string) => {
    const res = await fetch(`/api/polls/${poll.id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId }),
    });
    if (res.ok) onChanged();
  };

  return (
    <div className="poll-card">
      <h4 className="poll-question">{poll.question}</h4>
      <p className="poll-hint">Можеш да избереш повече от един вариант.</p>
      <div className="poll-votes-list">
        {poll.options.map((o) => {
          const pct = totalVotes ? Math.round((o.votes / totalVotes) * 100) : 0;
          const isMine = poll.myVotes.includes(o.id);
          const isWinner = hasVoted && maxVotes > 0 && o.votes === maxVotes;
          return (
            <button
              key={o.id}
              className={`poll-vote-row ${isMine ? "poll-voted" : ""} ${isWinner ? "poll-winner" : ""} ${hasVoted && !isWinner ? "poll-loser" : ""}`}
              onClick={() => toggle(o.id)}
            >
              <div className="poll-vote-label">
                <span>{isMine ? "☑" : "☐"} {fmt(o.date, o.time ?? undefined)}</span>
                {o.location && <span className="poll-vote-location">📍 {o.location}</span>}
                {o.voters.length > 0 && (
                  <span className="poll-voters">👤 {o.voters.join(", ")}</span>
                )}
              </div>
              <div className="poll-vote-right">
                {hasVoted && <span className="poll-pct">{pct}%</span>}
                <span className="poll-count">{o.votes} гласа</span>
              </div>
              {hasVoted && <div className="poll-bar" style={{ width: `${pct}%` }} />}
            </button>
          );
        })}
        {notVoted.length > 0 && (
          <p className="poll-not-voted">
            <strong>Още не са гласували:</strong> {notVoted.join(", ")}
          </p>
        )}

        {notVoted.length === 0 && (
          <p className="poll-all-voted">
            ✓ Всички са гласували
          </p>
        )}
      </div>
    </div>
  );
}

export default function PollSection() {
  const { userId, isPending } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [version, setVersion] = useState(0);
  const reload = () => setVersion((v) => v + 1);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/polls");
      if (res.ok && !cancelled) setPolls(await res.json());
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, version]);

  if (isPending) return null;

  if (!userId) {
    return (
      <section className="poll-section">
        <p>Влез в профила си, за да виждаш анкетите и да гласуваш.</p>
      </section>
    );
  }

  return (
    <section className="poll-section">
      <CreatePollForm onCreated={reload} />
      {polls.length > 0 && (
        <div className="poll-cards">
          {polls.map((p) => (
            <PollCard key={p.id} poll={p} onChanged={reload} />
          ))}
        </div>
      )}
    </section>
  );
}