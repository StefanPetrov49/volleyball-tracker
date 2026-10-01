import { NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/fileStore";
import type { Poll } from "@/data/polls";
import type { Match } from "@/data/matches";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { optionId, opponent, home } = await req.json() as {
    optionId: string;
    opponent: string;
    home: boolean;
  };

  const polls = readJson<Poll[]>("polls.json");
  const poll = polls.find((p) => p.id === id);
  if (!poll) return NextResponse.json({ error: "Poll not found" }, { status: 404 });

  const option = poll.options.find((o) => o.id === optionId);
  if (!option) return NextResponse.json({ error: "Option not found" }, { status: 404 });

  const match: Match = {
    id: crypto.randomUUID(),
    date: option.date,
    time: option.time,
    opponent,
    location: option.location,
    home,
  };

  const matches = readJson<Match[]>("matches.json");
  matches.push(match);
  writeJson("matches.json", matches);

  poll.addedToCalendar = optionId;
  writeJson("polls.json", polls);

  return NextResponse.json(match, { status: 201 });
}
