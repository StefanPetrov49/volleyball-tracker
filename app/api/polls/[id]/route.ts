import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser } from "@/lib/session";
import { updatePoll } from "@/lib/services/polls";
import { pollUpdateInput } from "@/lib/validation/poll";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getApiUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const parsedPollId = z.string().uuid().safeParse(id);
  const parsedBody = pollUpdateInput.safeParse(
    await req.json().catch(() => null),
  );

  if (!parsedPollId.success || !parsedBody.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const result = await updatePoll(
    user.id,
    user.role ?? null,
    parsedPollId.data,
    parsedBody.data,
  );

  if ("error" in result) {
    if (result.error === "not_found") {
      return NextResponse.json(
        { error: "Анкетата не е намерена." },
        { status: 404 },
      );
    }

    if (result.error === "forbidden") {
      return NextResponse.json(
        { error: "Нямате право да редактирате тази анкета." },
        { status: 403 },
      );
    }

    return NextResponse.json(
      { error: "Невалидни варианти за анкетата." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}