"use client";

import { useEffect, useState } from "react";
import type { Poll } from "@/types/poll";
import { useAuth } from "@/lib/AuthContext";

type OptionField = "label" | "date" | "time" | "location";

type DraftOption = {
  id?: string;
  label: string;
  date: string;
  time: string;
  location: string;
  votes?: number;
};

const emptyOption = (): DraftOption => ({
  label: "",
  date: "",
  time: "",
  location: "",
});

const isFilled = (o: DraftOption) =>
  [o.label, o.date, o.time, o.location].some((v) => v.trim() !== "");

const toPayload = ({ id, label, date, time, location }: DraftOption) => ({
  ...(id ? { id } : {}),
  label: label.trim() || null,
  date: date || null,
  time: time || null,
  location: location.trim() || null,
});

const fmtDate = (date: string | null, time?: string | null) => {
  if (!date) return time ?? "";

  const dateStr = new Date(date).toLocaleDateString("bg-BG", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return time ? `${dateStr}, ${time}` : dateStr;
};

function OptionRow({
  index,
  option,
  canRemove,
  disabled,
  onChange,
  onRemove,
}: {
  index: number;
  option: DraftOption;
  canRemove: boolean;
  disabled?: boolean;
  onChange: (field: OptionField, value: string) => void;
  onRemove: () => void;
}) {
  return (
    <div className="poll-option-row">
      <span className="poll-option-num">{index + 1}</span>

      <input
        className="poll-option-label"
        value={option.label}
        onChange={(e) => onChange("label", e.target.value)}
        placeholder="Свободен текст"
        maxLength={120}
      />

      <input
        type="date"
        value={option.date}
        onChange={(e) => onChange("date", e.target.value)}
      />

      <input
        type="time"
        value={option.time}
        onChange={(e) => onChange("time", e.target.value)}
      />

      <input
        value={option.location}
        onChange={(e) => onChange("location", e.target.value)}
        placeholder="Зала (по желание)"
        maxLength={120}
      />

      {canRemove && (
        <button
          type="button"
          className="poll-remove-btn"
          onClick={onRemove}
          disabled={disabled}
          aria-label="Премахни"
        >
          ✕
        </button>
      )}
    </div>
  );
}

function CreatePollForm({ onCreated }: { onCreated: () => void }) {
  const [question, setQuestion] = useState("Кога играем?");
  const [options, setOptions] = useState<DraftOption[]>([
    emptyOption(),
    emptyOption(),
  ]);
  const [error, setError] = useState<string | null>(null);

  const setOption = (index: number, field: OptionField, value: string) => {
    setOptions((current) =>
      current.map((o, i) => (i === index ? { ...o, [field]: value } : o)),
    );
  };

  const addOption = () => {
    if (options.length >= 10) return;
    setOptions((current) => [...current, emptyOption()]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions((current) => current.filter((_, i) => i !== index));
  };

  const applyYesNo = () => {
    setQuestion("");
    setOptions([
      { ...emptyOption(), label: "Да" },
      { ...emptyOption(), label: "Не" },
    ]);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    const filled = options.filter(isFilled);

    if (filled.length < 2) {
      setError("Попълни поне два варианта.");
      return;
    }

    setError(null);

    const response = await fetch("/api/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, options: filled.map(toPayload) }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Анкетата не можа да бъде създадена.");
      return;
    }

    onCreated();
    setQuestion("Кога играем?");
    setOptions([emptyOption(), emptyOption()]);
  };

  return (
    <form className="poll-form" onSubmit={submit}>
      <h3>Нова анкета</h3>

      <div className="poll-form-field">
        <label>Въпрос</label>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
          maxLength={200}
        />
      </div>

      {error && (
        <p role="alert" className="poll-error">
          {error}
        </p>
      )}

      <div className="poll-options-list">
        {options.map((option, index) => (
          <OptionRow
            key={index}
            index={index}
            option={option}
            canRemove={options.length > 2}
            onChange={(field, value) => setOption(index, field, value)}
            onRemove={() => removeOption(index)}
          />
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

        <button
          type="button"
          className="poll-add-option-btn"
          onClick={applyYesNo}
        >
          Да / Не
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
    poll.options.map((o) => ({
      id: o.id,
      label: o.label ?? "",
      date: o.date ?? "",
      time: o.time ?? "",
      location: o.location ?? "",
      votes: o.votes,
    })),
  );

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const setOption = (index: number, field: OptionField, value: string) => {
    setOptions((current) =>
      current.map((o, i) => (i === index ? { ...o, [field]: value } : o)),
    );
  };

  const addOption = () => {
    if (options.length >= 10) return;
    setOptions((current) => [...current, emptyOption()]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;

    const option = options[index];

    if (
      option.votes &&
      !window.confirm(
        `Този вариант има ${option.votes} ${
          option.votes === 1 ? "глас" : "гласа"
        }. При премахване ще бъдат изтрити само гласовете за този вариант. Продължаваме ли?`,
      )
    ) {
      return;
    }

    setOptions((current) => current.filter((_, i) => i !== index));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    const filled = options.filter(isFilled);

    if (filled.length < 2) {
      setError("Попълни поне два варианта.");
      return;
    }

    setSaving(true);
    setError(null);

    const response = await fetch(`/api/polls/${poll.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, options: filled.map(toPayload) }),
    });

    setSaving(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Анкетата не можа да бъде редактирана.");
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

      {error && (
        <p role="alert" className="poll-error">
          {error}
        </p>
      )}

      <div className="poll-form-field">
        <label>Въпрос</label>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
          maxLength={200}
        />
      </div>

      <div className="poll-options-list">
        {options.map((option, index) => (
          <OptionRow
            key={option.id ?? `new-${index}`}
            index={index}
            option={option}
            canRemove={options.length > 2}
            disabled={saving}
            onChange={(field, value) => setOption(index, field, value)}
            onRemove={() => removeOption(index)}
          />
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

        <button type="submit" className="poll-submit-btn" disabled={saving}>
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
  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
  const maxVotes = Math.max(...poll.options.map((o) => o.votes));

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
        <button type="button" className="poll-add-option-btn" onClick={onEdit}>
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
          const isWinner = hasVoted && maxVotes > 0 && option.votes === maxVotes;
          const when = fmtDate(option.date, option.time);

          return (
            <button
              key={option.id}
              className={`poll-vote-row ${isMine ? "poll-voted" : ""} ${
                isWinner ? "poll-winner" : ""
              } ${hasVoted && !isWinner ? "poll-loser" : ""}`}
              onClick={() => toggle(option.id)}
            >
              <div className="poll-vote-label">
                <span>
                  {isMine ? "☑" : "☐"}{" "}
                  {option.label && <strong>{option.label}</strong>}
                  {option.label && when ? " · " : ""}
                  {when}
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
                {hasVoted && <span className="poll-pct">{percentage}%</span>}
                <span className="poll-count">{option.votes} гласа</span>
              </div>

              {hasVoted && (
                <div className="poll-bar" style={{ width: `${percentage}%` }} />
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