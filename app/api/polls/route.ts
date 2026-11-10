import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/session";
import { createPoll, getPolls } from "@/lib/services/polls";
import { logActivity } from "@/lib/services/activity";
import { pollInput } from "@/lib/validation/poll";

// GET /api/polls?offset=0&limit=5 → { polls, hasMore }
export async function GET(req: Request) {
  const user = await getApiUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = new URL(req.url).searchParams;
  const offset = Math.max(0, Number.parseInt(params.get("offset") ?? "0", 10) || 0);
  const limit = Math.min(20, Math.max(1, Number.parseInt(params.get("limit") ?? "5", 10) || 5));

  return NextResponse.json(await getPolls(user.id, { offset, limit }));
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
    return NextResponse.json(
      { error: "Попълни въпроса и поне два непразни варианта." },
      { status: 400 },
    );
  }

  const id = await createPoll(user.id, parsed.data);
  await logActivity(user, "poll.created", `създаде анкета „${parsed.data.question}“`, "/?view=polls");

  return NextResponse.json({ id }, { status: 201 });
}