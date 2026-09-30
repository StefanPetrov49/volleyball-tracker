"use client";
import { useEffect, useState } from "react";
import type { Poll } from "@/data/polls";

const fmt = (date: string, time?: string) => {
  const d = new Date(date);
  const dateStr = d.toLocaleDateString("bg-BG", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
  return time ? `${dateStr}, ${time}` : dateStr;
};

function CreatePollForm({ onCreated }: { onCreated: (poll: Poll) => void }) {
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
    const poll = await res.json() as Poll;
    onCreated(poll);
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

function PollCard({ poll: initial }: { poll: Poll }) {
  const [poll, setPoll] = useState(initial);
  const [voted, setVoted] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [opponent, setOpponent] = useState("");
  const [home, setHome] = useState(true);

  const totalVotes = poll.options.reduce((s, o) => s + o.votes, 0);
  const winner = poll.options.reduce((a, b) => (a.votes >= b.votes ? a : b));

  const vote = async (optionId: string) => {
    if (voted) return;
    const res = await fetch(`/api/polls/${poll.id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId }),
    });
    const updated = await res.json() as Poll;
    setPoll(updated);
    setVoted(optionId);
  };

  const addToCalendar = async () => {
    if (!opponent.trim()) return;
    await fetch(`/api/polls/${poll.id}/add-to-calendar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId: winner.id, opponent, home }),
    });
    setPoll((p) => ({ ...p, addedToCalendar: winner.id }));
    setAdding(false);
  };

  return (
    <div className={`poll-card ${poll.addedToCalendar ? "poll-card-done" : ""}`}>
      <h4 className="poll-question">{poll.question}</h4>
      <div className="poll-votes-list">
        {poll.options.map((o) => {
          const pct = totalVotes ? Math.round((o.votes / totalVotes) * 100) : 0;
          const isWinner = voted && o.id === winner.id;
          return (
            <button
              key={o.id}
              className={`poll-vote-row ${voted === o.id ? "poll-voted" : ""} ${isWinner ? "poll-winner" : ""} ${voted && !isWinner ? "poll-loser" : ""}`}
              onClick={() => vote(o.id)}
              disabled={!!voted || !!poll.addedToCalendar}
            >
              <div className="poll-vote-label">
                <span>{fmt(o.date, o.time)}</span>
                {o.location && <span className="poll-vote-location">📍 {o.location}</span>}
              </div>
              <div className="poll-vote-right">
                {voted && <span className="poll-pct">{pct}%</span>}
                <span className="poll-count">{o.votes} гласа</span>
              </div>
              {voted && (
                <div className="poll-bar" style={{ width: `${pct}%` }} />
              )}
            </button>
          );
        })}
      </div>

      {voted && !poll.addedToCalendar && (
        <div className="poll-winner-actions">
          {!adding ? (
            <button className="poll-add-cal-btn" onClick={() => setAdding(true)}>
              📅 Добави победителя в календара
            </button>
          ) : (
            <div className="poll-add-cal-form">
              <input
                placeholder="Противник"
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
              />
              <label className="poll-home-toggle">
                <input type="checkbox" checked={home} onChange={(e) => setHome(e.target.checked)} />
                Домакини
              </label>
              <button className="poll-submit-btn" onClick={addToCalendar} disabled={!opponent.trim()}>Добави</button>
              <button className="poll-cancel-btn" onClick={() => setAdding(false)}>Откажи</button>
            </div>
          )}
        </div>
      )}

      {poll.addedToCalendar && (
        <p className="poll-added-note">✅ Добавено в календара</p>
      )}
    </div>
  );
}

export default function PollSection() {
  const [polls, setPolls] = useState<Poll[]>([]);

  useEffect(() => {
    fetch("/api/polls").then((r) => r.json()).then(setPolls);
  }, []);

  const onCreated = (poll: Poll) => setPolls((prev) => [poll, ...prev]);

  return (
    <section className="poll-section">
      <CreatePollForm onCreated={onCreated} />
      {polls.length > 0 && (
        <div className="poll-cards">
          {polls.map((p) => <PollCard key={p.id} poll={p} />)}
        </div>
      )}
    </section>
  );
}
