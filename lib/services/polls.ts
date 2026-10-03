import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "../db";
import { matches, pollOptions, polls, user, votes } from "../../db/schema";
import type { Poll } from "../../types/poll";
import type { PollInput } from "../validation/poll";

const hhmm = (t: string | null) => (t ? t.slice(0, 5) : null);

export async function getPolls(userId: string | null): Promise<Poll[]> {
  const [pollRows, optionRows, voteRows] = await Promise.all([
    db.select().from(polls).orderBy(desc(polls.createdAt)),
    db.select().from(pollOptions).orderBy(asc(pollOptions.date), asc(pollOptions.time)),
    db
      .select({ pollId: votes.pollId, optionId: votes.optionId, userId: votes.userId, name: user.name })
      .from(votes)
      .innerJoin(user, eq(votes.userId, user.id)),
  ]);

  return pollRows.map((p) => ({
    id: p.id,
    question: p.question,
    createdAt: p.createdAt.toISOString(),
    addedToCalendar: p.addedOptionId,
    myVote: voteRows.find((v) => v.pollId === p.id && v.userId === userId)?.optionId ?? null,
    options: optionRows
      .filter((o) => o.pollId === p.id)
      .map((o) => {
        const voters = voteRows.filter((v) => v.optionId === o.id).map((v) => v.name);
        return {
          id: o.id,
          date: o.date,
          time: hhmm(o.time),
          location: o.location,
          votes: voters.length,
          voters,
        };
      }),
  }));
}

export async function createPoll(userId: string, input: PollInput) {
  return db.transaction(async (tx) => {
    const [poll] = await tx
      .insert(polls)
      .values({ question: input.question, createdBy: userId })
      .returning({ id: polls.id });
    await tx.insert(pollOptions).values(input.options.map((o) => ({ pollId: poll.id, ...o })));
    return poll.id;
  });
}

export async function castVote(userId: string, pollId: string, optionId: string) {
  const [option] = await db
    .select()
    .from(pollOptions)
    .where(and(eq(pollOptions.id, optionId), eq(pollOptions.pollId, pollId)));
  if (!option) return { error: "not_found" as const };

  const [poll] = await db.select().from(polls).where(eq(polls.id, pollId));
  if (poll.matchId) return { error: "closed" as const };

  await db
    .insert(votes)
    .values({ pollId, optionId, userId })
    .onConflictDoUpdate({ target: [votes.pollId, votes.userId], set: { optionId } });
  return { ok: true as const };
}

export async function addWinnerToCalendar(
  pollId: string,
  optionId: string,
  opponent: string,
  home: boolean
) {
  return db.transaction(async (tx) => {
    const [poll] = await tx.select().from(polls).where(eq(polls.id, pollId));
    if (!poll) return { error: "not_found" as const };
    if (poll.matchId) return { error: "already_added" as const };

    const [option] = await tx
      .select()
      .from(pollOptions)
      .where(and(eq(pollOptions.id, optionId), eq(pollOptions.pollId, pollId)));
    if (!option) return { error: "not_found" as const };

    const [match] = await tx
      .insert(matches)
      .values({
        date: option.date,
        time: option.time,
        opponent,
        location: option.location,
        home,
      })
      .returning({ id: matches.id });

    await tx
      .update(polls)
      .set({ matchId: match.id, addedOptionId: option.id })
      .where(eq(polls.id, pollId));
    return { ok: true as const, matchId: match.id };
  });
}