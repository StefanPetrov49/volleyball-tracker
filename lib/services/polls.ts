import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "../db";
import { pollOptions, polls, user, votes } from "../../db/schema";
import type { Poll } from "../../types/poll";
import type { PollInput, PollUpdateInput } from "../validation/poll";

const hhmm = (t: string | null) => (t ? t.slice(0, 5) : null);

type PollRow = typeof polls.$inferSelect;

/** Builds full Poll objects (options, votes, who hasn't voted) for just these polls. */
async function buildPolls(userId: string | null, pollRows: PollRow[]): Promise<Poll[]> {
    if (pollRows.length === 0) return [];
    const ids = pollRows.map((p) => p.id);

    const [optionRows, voteRows, teamUsers] = await Promise.all([
        db
            .select()
            .from(pollOptions)
            .where(inArray(pollOptions.pollId, ids))
            .orderBy(asc(pollOptions.position), asc(pollOptions.date), asc(pollOptions.time)),
        db
            .select({ pollId: votes.pollId, optionId: votes.optionId, userId: votes.userId, name: user.name })
            .from(votes)
            .innerJoin(user, eq(votes.userId, user.id))
            .where(inArray(votes.pollId, ids)),
        db.select({ id: user.id, name: user.name, banned: user.banned }).from(user),
    ]);

    const activeUsers = teamUsers.filter((u) => !u.banned);

    return pollRows.map((poll) => {
        const pollVotes = voteRows.filter((v) => v.pollId === poll.id);
        const voterIds = new Set(pollVotes.map((v) => v.userId));

        return {
            id: poll.id,
            question: poll.question,
            createdBy: poll.createdBy,
            createdAt: poll.createdAt.toISOString(),
            myVotes: pollVotes.filter((v) => v.userId === userId).map((v) => v.optionId),
            notVoted: activeUsers.filter((u) => !voterIds.has(u.id)).map((u) => u.name),
            options: optionRows
                .filter((o) => o.pollId === poll.id)
                .map((o) => {
                    const voters = pollVotes.filter((v) => v.optionId === o.id).map((v) => v.name);
                    return {
                        id: o.id,
                        label: o.label,
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

/**
 * One page of polls, newest first. Only the polls on this page (and their options/votes)
 * are loaded – the old version loaded every poll and vote ever made on each request.
 */
export async function getPolls(
    userId: string | null,
    { offset = 0, limit = 5 }: { offset?: number; limit?: number } = {},
): Promise<{ polls: Poll[]; hasMore: boolean }> {
    const rows = await db
        .select()
        .from(polls)
        .orderBy(desc(polls.createdAt), desc(polls.id))
        .limit(limit + 1) // one extra tells us if there's another page
        .offset(offset);

    return { polls: await buildPolls(userId, rows.slice(0, limit)), hasMore: rows.length > limit };
}

/** A single poll – sent back after a vote so only that card refreshes. */
export async function getPoll(userId: string | null, pollId: string): Promise<Poll | null> {
    const rows = await db.select().from(polls).where(eq(polls.id, pollId)).limit(1);
    const [poll] = await buildPolls(userId, rows);
    return poll ?? null;
}

export async function createPoll(userId: string, input: PollInput) {
    return db.transaction(async (tx) => {
        const [poll] = await tx
            .insert(polls)
            .values({
                question: input.question,
                createdBy: userId,
            })
            .returning({ id: polls.id });

        await tx.insert(pollOptions).values(
            input.options.map((option, index) => ({
                pollId: poll.id,
                label: option.label,
                date: option.date,
                time: option.time,
                location: option.location,
                position: index,
            })),
        );

        return poll.id;
    });
}

export async function toggleVote(
    userId: string,
    pollId: string,
    optionId: string,
) {
    const [option] = await db
        .select()
        .from(pollOptions)
        .where(
            and(
                eq(pollOptions.id, optionId),
                eq(pollOptions.pollId, pollId),
            ),
        );

    if (!option) {
        return { error: "not_found" as const };
    }

    const removed = await db
        .delete(votes)
        .where(
            and(
                eq(votes.optionId, optionId),
                eq(votes.userId, userId),
            ),
        )
        .returning({ id: votes.id });

    if (removed.length === 0) {
        await db
            .insert(votes)
            .values({ pollId, optionId, userId })
            .onConflictDoNothing();
    }

    return { ok: true as const, voted: removed.length === 0 };
}

export async function updatePoll(
    userId: string,
    userRole: string | null,
    pollId: string,
    input: PollUpdateInput,
) {
    const [existingPoll] = await db
        .select({
            id: polls.id,
            createdBy: polls.createdBy,
        })
        .from(polls)
        .where(eq(polls.id, pollId))
        .limit(1);

    if (!existingPoll) {
        return { error: "not_found" as const };
    }

    const isAdmin = userRole === "admin";
    const isCreator = existingPoll.createdBy === userId;

    if (!isAdmin && !isCreator) {
        return { error: "forbidden" as const };
    }

    const submittedExistingIds = input.options
        .map((option) => option.id)
        .filter((id): id is string => typeof id === "string");

    if (new Set(submittedExistingIds).size !== submittedExistingIds.length) {
        return { error: "invalid_options" as const };
    }

    const existingOptions = await db
        .select({ id: pollOptions.id })
        .from(pollOptions)
        .where(eq(pollOptions.pollId, pollId));

    const existingOptionIds = new Set(
        existingOptions.map((option) => option.id),
    );

    if (
        submittedExistingIds.some(
            (optionId) => !existingOptionIds.has(optionId),
        )
    ) {
        return { error: "invalid_options" as const };
    }

    const optionIdsToDelete = existingOptions
        .map((option) => option.id)
        .filter((optionId) => !submittedExistingIds.includes(optionId));

    await db.transaction(async (tx) => {
        await tx
            .update(polls)
            .set({ question: input.question })
            .where(eq(polls.id, pollId));

        for (const [index, option] of input.options.entries()) {
            const values = {
                label: option.label,
                date: option.date,
                time: option.time,
                location: option.location,
                position: index,
            };

            if (option.id) {
                await tx
                    .update(pollOptions)
                    .set(values)
                    .where(
                        and(
                            eq(pollOptions.id, option.id),
                            eq(pollOptions.pollId, pollId),
                        ),
                    );
            } else {
                await tx.insert(pollOptions).values({ pollId, ...values });
            }
        }

        if (optionIdsToDelete.length > 0) {
            await tx
                .delete(pollOptions)
                .where(inArray(pollOptions.id, optionIdsToDelete));
        }
    });

    return { ok: true as const };
}