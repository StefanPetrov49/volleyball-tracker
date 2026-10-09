import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "../db";
import { pollOptions, polls, user, votes } from "../../db/schema";
import type { Poll } from "../../types/poll";
import type { PollInput, PollUpdateInput } from "../validation/poll";

const hhmm = (t: string | null) => (t ? t.slice(0, 5) : null);

export async function getPolls(userId: string | null): Promise<Poll[]> {
    const [pollRows, optionRows, voteRows, teamUsers] = await Promise.all([
        db.select().from(polls).orderBy(desc(polls.createdAt)),
        db
            .select()
            .from(pollOptions)
            .orderBy(asc(pollOptions.date), asc(pollOptions.time)),
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

    return pollRows.map((poll) => {
        const pollVotes = voteRows.filter((vote) => vote.pollId === poll.id);
        const voterIds = new Set(pollVotes.map((vote) => vote.userId));

        const notVoted = teamUsers
            .filter((teamUser) => !teamUser.banned && !voterIds.has(teamUser.id))
            .map((teamUser) => teamUser.name);

        return {
            id: poll.id,
            question: poll.question,
            createdBy: poll.createdBy,
            createdAt: poll.createdAt.toISOString(),
            myVotes: pollVotes
                .filter((vote) => vote.userId === userId)
                .map((vote) => vote.optionId),
            notVoted,
            options: optionRows
                .filter((option) => option.pollId === poll.id)
                .map((option) => {
                    const voters = pollVotes
                        .filter((vote) => vote.optionId === option.id)
                        .map((vote) => vote.name);

                    return {
                        id: option.id,
                        date: option.date,
                        time: hhmm(option.time),
                        location: option.location,
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
            .values({
                question: input.question,
                createdBy: userId,
            })
            .returning({ id: polls.id });

        await tx.insert(pollOptions).values(
            input.options.map((option) => ({
                pollId: poll.id,
                ...option,
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

    console.log("Existing poll found:", existingPoll);

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

        for (const option of input.options) {
            if (option.id) {
                await tx
                    .update(pollOptions)
                    .set({
                        date: option.date,
                        time: option.time,
                        location: option.location,
                    })
                    .where(
                        and(
                            eq(pollOptions.id, option.id),
                            eq(pollOptions.pollId, pollId),
                        ),
                    );
            } else {
                await tx.insert(pollOptions).values({
                    pollId,
                    date: option.date,
                    time: option.time,
                    location: option.location,
                });
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