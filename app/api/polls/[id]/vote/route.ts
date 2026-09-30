import { NextResponse } from "next/server";
import { polls } from "@/data/polls";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { optionId } = await req.json() as { optionId: string };

  const poll = polls.find((p) => p.id === id);
  if (!poll) return NextResponse.json({ error: "Poll not found" }, { status: 404 });

  const option = poll.options.find((o) => o.id === optionId);
  if (!option) return NextResponse.json({ error: "Option not found" }, { status: 404 });

  option.votes += 1;
  return NextResponse.json(poll);
}
