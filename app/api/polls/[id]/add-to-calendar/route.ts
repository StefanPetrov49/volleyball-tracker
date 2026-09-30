import { NextResponse } from "next/server";
import { polls } from "@/data/polls";
import { matches } from "@/data/matches";
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

  matches.push(match);
  poll.addedToCalendar = optionId;

  return NextResponse.json(match, { status: 201 });
}
