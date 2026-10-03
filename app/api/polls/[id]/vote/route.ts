import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser } from "@/lib/session";
import { castVote } from "@/lib/services/polls";

const body = z.object({ optionId: z.string().uuid() });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsedId = z.string().uuid().safeParse(id);
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsedId.success || !parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const res = await castVote(user.id, parsedId.data, parsed.data.optionId);
  if ("error" in res) {
    return NextResponse.json({ error: res.error }, { status: res.error === "closed" ? 409 : 404 });
  }
  return NextResponse.json({ ok: true });
}