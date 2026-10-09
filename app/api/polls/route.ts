import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/session";
import { createPoll, getPolls } from "@/lib/services/polls";
import { pollInput } from "@/lib/validation/poll";

export async function GET() {
  const user = await getApiUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(await getPolls(user.id));
}

export async function POST(req: Request) {
  const user = await getApiUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = pollInput.safeParse(
    await req.json().catch(() => null),
  );

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const id = await createPoll(user.id, parsed.data);

  return NextResponse.json({ id }, { status: 201 });
}