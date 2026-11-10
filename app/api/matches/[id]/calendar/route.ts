import { NextResponse } from "next/server";
import { z } from "zod";
import { getMatchById } from "@/lib/services/matches";
import { buildMatchIcs, icsFileName } from "@/lib/calendar-export";

type Ctx = { params: Promise<{ id: string }> };

// Public: returns a single match as an .ics file (Apple Calendar, Outlook, etc.)
export async function GET(_req: Request, ctx: Ctx) {
  const id = z.string().uuid().safeParse((await ctx.params).id);
  if (!id.success) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const match = await getMatchById(id.data);
  if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return new NextResponse(buildMatchIcs(match), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${icsFileName(match)}"`,
      "Cache-Control": "no-store",
    },
  });
}
