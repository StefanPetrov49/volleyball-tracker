"use client";

import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";
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

    toast("Анкетата е създадена");
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

    toast("Анкетата е обновена");
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

/** What the poll looks like right after I tap an option (before the server answers). */
function applyMyToggle(poll: Poll, optionId: string, myName: string): Poll {
  const wasMine = poll.myVotes.includes(optionId);
  const myVotes = wasMine ? poll.myVotes.filter((id) => id !== optionId) : [...poll.myVotes, optionId];
  const options = poll.options.map((o) => {
    if (o.id !== optionId) return o;
    const voters = wasMine ? o.voters.filter((n, i) => i !== o.voters.indexOf(myName)) : [...o.voters, myName];
    return { ...o, votes: voters.length, voters };
  });
  const others = (poll.notVoted ?? []).filter((n) => n !== myName);
  return { ...poll, myVotes, options, notVoted: myVotes.length === 0 ? [...others, myName] : others };
}

function PollCard({
  poll,
  canEdit,
  myName,
  onUpdate,
  onEdit,
}: {
  poll: Poll;
  canEdit: boolean;
  myName: string;
  onUpdate: (poll: Poll) => void;
  onEdit: () => void;
}) {
  const [voteError, setVoteError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const notVoted = poll.notVoted ?? [];
  const hasVoted = poll.myVotes.length > 0;
  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
  const maxVotes = Math.max(...poll.options.map((o) => o.votes));

  // Show the vote immediately; then take the server's version of this one poll
  const toggle = async (optionId: string) => {
    if (busy) return;
    const before = poll;
    setBusy(true);
    setVoteError(null);
    onUpdate(applyMyToggle(poll, optionId, myName));
    try {
      const response = await fetch(`/api/polls/${poll.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId }),
      });
      if (!response.ok) throw new Error();
      const body = (await response.json()) as { poll?: Poll | null };
      if (body.poll) onUpdate(body.poll);
    } catch {
      onUpdate(before);
      setVoteError("Гласът не беше записан. Опитай пак.");
    } finally {
      setBusy(false);
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
                <span className="poll-count">{option.votes} {option.votes === 1 ? "глас" : "гласа"}</span>
              </div>

              {hasVoted && (
                <div className="poll-bar" style={{ width: `${percentage}%` }} />
              )}
            </button>
          );
        })}

        {voteError && <p className="poll-vote-error" role="alert">{voteError}</p>}

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

const PAGE_SIZE = 5;

type PollPage = { polls: Poll[]; hasMore: boolean };

async function fetchPollPage(offset: number): Promise<PollPage | null> {
  const response = await fetch(`/api/polls?offset=${offset}&limit=${PAGE_SIZE}`);
  return response.ok ? ((await response.json()) as PollPage) : null;
}

export default function PollSection() {
  const { userId, username, isPending } = useAuth();

  const [polls, setPolls] = useState<Poll[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [version, setVersion] = useState(0);
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null);

  // after creating / editing a poll: start again from the newest page
  const reload = () => {
    setEditingPoll(null);
    setVersion((current) => current + 1);
  };

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    fetchPollPage(0).then((page) => {
      if (cancelled) return;
      if (page) {
        setPolls(page.polls);
        setHasMore(page.hasMore);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [userId, version]);

  const loadMore = async () => {
    setLoadingMore(true);
    const page = await fetchPollPage(polls.length);
    setLoadingMore(false);
    if (!page) return;
    // skip any poll we already show (e.g. if a new poll was created meanwhile)
    setPolls((current) => [...current, ...page.polls.filter((p) => !current.some((c) => c.id === p.id))]);
    setHasMore(page.hasMore);
  };

  const replacePoll = (updated: Poll) =>
    setPolls((current) => current.map((p) => (p.id === updated.id ? updated : p)));

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

      {loading && <p className="poll-loading">Зареждане на анкетите…</p>}

      {polls.length > 0 && (
        <div className="poll-cards">
          {polls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              canEdit={poll.createdBy === userId}
              myName={username ?? "Ти"}
              onUpdate={replacePoll}
              onEdit={() => setEditingPoll(poll)}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <button type="button" className="poll-load-more" onClick={loadMore} disabled={loadingMore}>
          {loadingMore ? "Зареждане…" : "Покажи по-стари анкети"}
        </button>
      )}
    </section>
  );
}