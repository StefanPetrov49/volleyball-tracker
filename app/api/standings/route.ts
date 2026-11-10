import { NextResponse } from "next/server";
import { getOurStandings, StandingsError, STANDINGS_SOURCE_URL } from "@/lib/standings";
import { log } from "@/lib/logger";

// Our group's table from volleymania.com.
// volleymania itself is fetched at most every 10 minutes (see lib/standings.ts).
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getOurStandings());
  } catch (e) {
    if (!(e instanceof StandingsError)) throw e;
    log.warn("standings.fetch_failed", { reason: e.message });
    return NextResponse.json(
      { error: "Класирането не може да се зареди в момента.", sourceUrl: STANDINGS_SOURCE_URL },
      { status: 502 },
    );
  }
}
