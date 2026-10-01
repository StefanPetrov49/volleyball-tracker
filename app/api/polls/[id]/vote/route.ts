import { NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/fileStore";
import type { Poll } from "@/data/polls";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { optionId, username } = await req.json() as { optionId: string; username?: string };

  const polls = readJson<Poll[]>("polls.json");
  const poll = polls.find((p) => p.id === id);
  if (!poll) return NextResponse.json({ error: "Poll not found" }, { status: 404 });

  const option = poll.options.find((o) => o.id === optionId);
  if (!option) return NextResponse.json({ error: "Option not found" }, { status: 404 });

  if (!poll.userVotes) poll.userVotes = {};

  // If user already voted for a different option, remove that vote first
  const previousOptionId = username ? poll.userVotes[username] : undefined;
  if (previousOptionId && previousOptionId !== optionId) {
    const prev = poll.options.find((o) => o.id === previousOptionId);
    if (prev) prev.votes = Math.max(0, prev.votes - 1);
  }

  // Only increment if switching to a new option (not re-clicking the same one)
  if (!previousOptionId || previousOptionId !== optionId) {
    option.votes += 1;
  }

  if (username) {
    poll.userVotes[username] = optionId;
  }

  writeJson("polls.json", polls);
  return NextResponse.json(poll);
}

