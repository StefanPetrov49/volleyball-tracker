import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser } from "@/lib/session";
import { deleteMatch, updateMatch } from "@/lib/services/matches";
import { matchSchema } from "@/lib/validation/match";

type Ctx = { params: Promise<{ id: string }> };

async function guard(ctx: Ctx) {
  const user = await getApiUser();
  if (!user) return { res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (user.role !== "admin") return { res: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  const id = z.string().uuid().safeParse((await ctx.params).id);
  if (!id.success) return { res: NextResponse.json({ error: "Invalid id" }, { status: 400 }) };
  return { id: id.data };
}

export async function PATCH(req: Request, ctx: Ctx) {
  const g = await guard(ctx);
  if ("res" in g) return g.res;
  const parsed = matchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const ok = await updateMatch(g.id, parsed.data);
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const g = await guard(ctx);
  if ("res" in g) return g.res;
  const ok = await deleteMatch(g.id);
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Not found" }, { status: 404 });
}