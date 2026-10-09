import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser } from "@/lib/session";
import { toggleVote } from "@/lib/services/polls";

const voteBody = z.object({
  optionId: z.string().uuid(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getApiUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const parsedPollId = z.string().uuid().safeParse(id);
  const parsedBody = voteBody.safeParse(
    await req.json().catch(() => null),
  );

  if (!parsedPollId.success || !parsedBody.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const result = await toggleVote(
    user.id,
    parsedPollId.data,
    parsedBody.data.optionId,
  );

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    voted: result.voted,
  });
}