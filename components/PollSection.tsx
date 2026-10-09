"use client";

import { useEffect, useState } from "react";
import type { Poll } from "@/types/poll";
import { useAuth } from "@/lib/AuthContext";

type DraftOption = {
  id?: string;
  date: string;
  time: string;
  location: string;
  votes?: number;
};

const fmt = (date: string, time?: string) => {
  const d = new Date(date);
  const dateStr = d.toLocaleDateString("bg-BG", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return time ? `${dateStr}, ${time}` : dateStr;
};

function CreatePollForm({ onCreated }: { onCreated: () => void }) {
  const [question, setQuestion] = useState("Кога играем?");
  const [options, setOptions] = useState([
    { date: "", time: "", location: "" },
    { date: "", time: "", location: "" },
  ]);

  const setOption = (index: number, field: string, value: string) => {
    setOptions((current) =>
      current.map((option, optionIndex) =>
        optionIndex === index
          ? { ...option, [field]: value }
          : option,
      ),
    );
  };

  const addOption = () => {
    if (options.length >= 10) return;

    setOptions((current) => [
      ...current,
      { date: "", time: "", location: "" },
    ]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;

    setOptions((current) =>
      current.filter((_, optionIndex) => optionIndex !== index),
    );
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    const filledOptions = options.filter((option) => option.date);

    if (filledOptions.length < 2) {
      return;
    }

    const response = await fetch("/api/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        options: filledOptions,
      }),
    });

    if (!response.ok) {
      return;
    }

    onCreated();
    setQuestion("Кога играем?");
    setOptions([
      { date: "", time: "", location: "" },
      { date: "", time: "", location: "" },
    ]);
  };

  return (
    <form className="poll-form" onSubmit={submit}>
      <h3>Нова анкета</h3>

      <div className="poll-form-field">
        <label>Въпрос</label>
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          required
        />
      </div>

      <div className="poll-options-list">
        {options.map((option, index) => (
          <div key={index} className="poll-option-row">
            <span className="poll-option-num">{index + 1}</span>

            <input
              type="date"
              value={option.date}
              onChange={(event) =>
                setOption(index, "date", event.target.value)
              }
              required
              placeholder="Дата"
            />

            <input
              type="time"
              value={option.time}
              onChange={(event) =>
                setOption(index, "time", event.target.value)
              }
              placeholder="Час"
            />

            <input
              value={option.location}
              onChange={(event) =>
                setOption(index, "location", event.target.value)
              }
              placeholder="Зала (по желание)"
            />

            {options.length > 2 && (
              <button
                type="button"
                className="poll-remove-btn"
                onClick={() => removeOption(index)}
                aria-label="Премахни"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="poll-form-actions">
        <button
          type="button"
          className="poll-add-option-btn"
          onClick={addOption}
          disabled={options.length >= 10}
        >
          + Добави вариант
        </button>

        <button type="submit" className="poll-submit-btn">
          Създай анкета
        </button>
      </div>
    </form>
  );
}

function EditPollForm({
  poll,
  onSaved,
  onCancel,
}: {
  poll: Poll;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [question, setQuestion] = useState(poll.question);

  const [options, setOptions] = useState<DraftOption[]>(
    poll.options.map((option) => ({
      id: option.id,
      date: option.date,
      time: option.time ?? "",
      location: option.location ?? "",
      votes: option.votes,
    })),
  );

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const setOption = (
    index: number,
    field: "date" | "time" | "location",
    value: string,
  ) => {
    setOptions((current) =>
      current.map((option, optionIndex) =>
        optionIndex === index
          ? { ...option, [field]: value }
          : option,
      ),
    );
  };

  const addOption = () => {
    if (options.length >= 10) return;

    setOptions((current) => [
      ...current,
      { date: "", time: "", location: "" },
    ]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;

    const option = options[index];

    if (
      option.votes &&
      !window.confirm(
        `Този вариант има ${option.votes} ${option.votes === 1 ? "глас" : "гласа"
        }. При премахване ще бъдат изтрити само гласовете за този вариант. Продължаваме ли?`,
      )
    ) {
      return;
    }

    setOptions((current) =>
      current.filter((_, optionIndex) => optionIndex !== index),
    );
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    const filledOptions = options.filter((option) => option.date);

    if (filledOptions.length < 2) {
      setError("Добави поне два варианта с дата.");
      return;
    }

    setSaving(true);
    setError(null);

    const response = await fetch(`/api/polls/${poll.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        options: filledOptions.map(({ id, date, time, location }) => ({
          ...(id ? { id } : {}),
          date,
          time,
          location,
        })),
      }),
    });

    setSaving(false);

    if (!response.ok) {
      const responseBody = await response.json().catch(() => null);

      setError(
        responseBody?.error ?? "Анкетата не можа да бъде редактирана.",
      );
      return;
    }

    onSaved();
  };

  return (
    <form className="poll-form" onSubmit={submit}>
      <h3>Редактирай анкета</h3>

      <p className="poll-hint">
        Корекциите по съществуващи варианти запазват гласовете. При
        премахване на вариант се изтриват само неговите гласове.
      </p>

      {error && <p role="alert">{error}</p>}

      <div className="poll-form-field">
        <label>Въпрос</label>

        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          required
          maxLength={200}
        />
      </div>

      <div className="poll-options-list">
        {options.map((option, index) => (
          <div key={option.id ?? `new-${index}`} className="poll-option-row">
            <span className="poll-option-num">{index + 1}</span>

            <input
              type="date"
              value={option.date}
              onChange={(event) =>
                setOption(index, "date", event.target.value)
              }
              required
            />

            <input
              type="time"
              value={option.time}
              onChange={(event) =>
                setOption(index, "time", event.target.value)
              }
            />

            <input
              value={option.location}
              onChange={(event) =>
                setOption(index, "location", event.target.value)
              }
              placeholder="Зала (по желание)"
              maxLength={120}
            />

            {options.length > 2 && (
              <button
                type="button"
                className="poll-remove-btn"
                onClick={() => removeOption(index)}
                aria-label="Премахни"
                disabled={saving}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="poll-form-actions">
        <button
          type="button"
          className="poll-add-option-btn"
          onClick={addOption}
          disabled={options.length >= 10 || saving}
        >
          + Добави вариант
        </button>

        <button
          type="button"
          className="poll-add-option-btn"
          onClick={onCancel}
          disabled={saving}
        >
          Отказ
        </button>

        <button
          type="submit"
          className="poll-submit-btn"
          disabled={saving}
        >
          {saving ? "Запазване..." : "Запази промените"}
        </button>
      </div>
    </form>
  );
}

function PollCard({
  poll,
  canEdit,
  onChanged,
  onEdit,
}: {
  poll: Poll;
  canEdit: boolean;
  onChanged: () => void;
  onEdit: () => void;
}) {
  const notVoted = poll.notVoted ?? [];
  const hasVoted = poll.myVotes.length > 0;
  const totalVotes = poll.options.reduce(
    (sum, option) => sum + option.votes,
    0,
  );
  const maxVotes = Math.max(...poll.options.map((option) => option.votes));

  const toggle = async (optionId: string) => {
    const response = await fetch(`/api/polls/${poll.id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId }),
    });

    if (response.ok) {
      onChanged();
    }
  };

  return (
    <div className="poll-card">
      <h4 className="poll-question">{poll.question}</h4>

      {canEdit && (
        <button
          type="button"
          className="poll-add-option-btn"
          onClick={onEdit}
        >
          Редактирай
        </button>
      )}

      <p className="poll-hint">Можеш да избереш повече от един вариант.</p>

      <div className="poll-votes-list">
        {poll.options.map((option) => {
          const percentage = totalVotes
            ? Math.round((option.votes / totalVotes) * 100)
            : 0;

          const isMine = poll.myVotes.includes(option.id);
          const isWinner =
            hasVoted && maxVotes > 0 && option.votes === maxVotes;

          return (
            <button
              key={option.id}
              className={`poll-vote-row ${isMine ? "poll-voted" : ""} ${isWinner ? "poll-winner" : ""
                } ${hasVoted && !isWinner ? "poll-loser" : ""}`}
              onClick={() => toggle(option.id)}
            >
              <div className="poll-vote-label">
                <span>
                  {isMine ? "☑" : "☐"}{" "}
                  {fmt(option.date, option.time ?? undefined)}
                </span>

                {option.location && (
                  <span className="poll-vote-location">
                    📍 {option.location}
                  </span>
                )}

                {option.voters.length > 0 && (
                  <span className="poll-voters">
                    👤 {option.voters.join(", ")}
                  </span>
                )}
              </div>

              <div className="poll-vote-right">
                {hasVoted && (
                  <span className="poll-pct">{percentage}%</span>
                )}

                <span className="poll-count">
                  {option.votes} гласа
                </span>
              </div>

              {hasVoted && (
                <div
                  className="poll-bar"
                  style={{ width: `${percentage}%` }}
                />
              )}
            </button>
          );
        })}

        {notVoted.length > 0 && (
          <p className="poll-not-voted">
            <strong>Още не са гласували:</strong> {notVoted.join(", ")}
          </p>
        )}

        {notVoted.length === 0 && (
          <p className="poll-all-voted">✓ Всички са гласували</p>
        )}
      </div>
    </div>
  );
}

export default function PollSection() {
  const { userId, isPending } = useAuth();

  const [polls, setPolls] = useState<Poll[]>([]);
  const [version, setVersion] = useState(0);
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null);

  const reload = () => {
    setEditingPoll(null);
    setVersion((current) => current + 1);
  };

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    (async () => {
      const response = await fetch("/api/polls");

      if (response.ok && !cancelled) {
        setPolls(await response.json());
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, version]);

  if (isPending) {
    return null;
  }

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

      {editingPoll && (
        <EditPollForm
          poll={editingPoll}
          onSaved={reload}
          onCancel={() => setEditingPoll(null)}
        />
      )}

      {polls.length > 0 && (
        <div className="poll-cards">
          {polls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              canEdit={poll.createdBy === userId}
              onChanged={reload}
              onEdit={() => setEditingPoll(poll)}
            />
          ))}
        </div>
      )}
    </section>
  );
}