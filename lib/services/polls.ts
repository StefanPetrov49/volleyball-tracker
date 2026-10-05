import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "../db";
import { pollOptions, polls, user, votes } from "../../db/schema";
import type { Poll } from "../../types/poll";
import type { PollInput } from "../validation/poll";

const hhmm = (t: string | null) => (t ? t.slice(0, 5) : null);

export async function getPolls(userId: string | null): Promise<Poll[]> {
    const [pollRows, optionRows, voteRows, teamUsers] = await Promise.all([
        db.select().from(polls).orderBy(desc(polls.createdAt)),
        db.select().from(pollOptions).orderBy(asc(pollOptions.date), asc(pollOptions.time)),
        db
            .select({
                pollId: votes.pollId,
                optionId: votes.optionId,
                userId: votes.userId,
                name: user.name,
            })
            .from(votes)
            .innerJoin(user, eq(votes.userId, user.id)),
        db
            .select({
                id: user.id,
                name: user.name,
                role: user.role,
                banned: user.banned,
            })
            .from(user),
    ]);

    return pollRows.map((p) => {
        const pollVotes = voteRows.filter((v) => v.pollId === p.id);
        const voterIds = new Set(pollVotes.map((v) => v.userId));

        const notVoted = teamUsers
            .filter((u) => !u.banned && !voterIds.has(u.id))
            .map((u) => u.name);

        return {
            id: p.id,
            question: p.question,
            createdAt: p.createdAt.toISOString(),
            myVotes: pollVotes
                .filter((v) => v.userId === userId)
                .map((v) => v.optionId),
            notVoted,
            options: optionRows
                .filter((o) => o.pollId === p.id)
                .map((o) => {
                    const voters = pollVotes
                        .filter((v) => v.optionId === o.id)
                        .map((v) => v.name);

                    return {
                        id: o.id,
                        date: o.date,
                        time: hhmm(o.time),
                        location: o.location,
                        votes: voters.length,
                        voters,
                    };
                }),
        };
    });
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

export async function toggleVote(userId: string, pollId: string, optionId: string) {
    const [option] = await db
        .select()
        .from(pollOptions)
        .where(and(eq(pollOptions.id, optionId), eq(pollOptions.pollId, pollId)));
    if (!option) return { error: "not_found" as const };

    const removed = await db
        .delete(votes)
        .where(and(eq(votes.optionId, optionId), eq(votes.userId, userId)))
        .returning({ id: votes.id });

    if (removed.length === 0) {
        await db.insert(votes).values({ pollId, optionId, userId }).onConflictDoNothing();
    }
    return { ok: true as const, voted: removed.length === 0 };
}