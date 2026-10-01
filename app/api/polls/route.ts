import { NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/fileStore";
import type { Poll, PollOption } from "@/data/polls";

export async function GET() {
  const polls = readJson<Poll[]>("polls.json");
  return NextResponse.json(polls);
}

export async function POST(req: Request) {
  const { question, options } = await req.json() as {
    question: string;
    options: { date: string; time?: string; location?: string }[];
  };

  const poll: Poll = {
    id: crypto.randomUUID(),
    question,
    options: options.map((o): PollOption => ({
      id: crypto.randomUUID(),
      date: o.date,
      time: o.time,
      location: o.location,
      votes: 0,
    })),
    createdAt: new Date().toISOString(),
  };

  const polls = readJson<Poll[]>("polls.json");
  polls.push(poll);
  writeJson("polls.json", polls);

  return NextResponse.json(poll, { status: 201 });
}
