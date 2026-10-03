import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser } from "@/lib/session";
import { addWinnerToCalendar } from "@/lib/services/polls";

const body = z.object({
  optionId: z.string().uuid(),
  opponent: z.string().trim().min(1).max(80),
  home: z.boolean(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const parsedId = z.string().uuid().safeParse(id);
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsedId.success || !parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const res = await addWinnerToCalendar(
    parsedId.data,
    parsed.data.optionId,
    parsed.data.opponent,
    parsed.data.home
  );
  if ("error" in res) {
    return NextResponse.json({ error: res.error }, { status: res.error === "already_added" ? 409 : 404 });
  }
  return NextResponse.json({ matchId: res.matchId }, { status: 201 });
}