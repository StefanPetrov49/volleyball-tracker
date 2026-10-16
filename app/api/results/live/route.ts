import { NextResponse } from "next/server";
import { getLiveMatches } from "@/lib/results";

export const dynamic = "force-dynamic";

export async function GET() {
  const live = await getLiveMatches();

  return NextResponse.json(
    live.map((m) => ({
      id: m.id,
      teamA: m.teamA.name,
      teamB: m.teamB.name,
      hasVideo: Boolean(m.videoUrl),
    })),
    { headers: { "Cache-Control": "no-store" } },
  );
}