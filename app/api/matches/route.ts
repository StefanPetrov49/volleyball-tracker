import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/session";
import { createMatch, getMatches } from "@/lib/services/matches";
import { matchSchema } from "@/lib/validation/match";
import { log } from "@/lib/logger";

export async function GET() {
  return NextResponse.json(await getMatches());
}

export async function POST(req: Request) {
  const user = await getApiUser();
  if (!user) {
    log.warn("matches.create.unauthenticated");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  if (user.role !== "admin") {
    log.warn("matches.create.forbidden", {
      actorUserId: user.id,
    });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = matchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const id = await createMatch(parsed.data);
  log.info("matches.created", {
    actorUserId: user.id,
    matchId: id,
  });
  return NextResponse.json({ id }, { status: 201 });
}