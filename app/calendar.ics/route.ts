import { getMatches } from "@/lib/services/matches";
import { buildSeasonIcs } from "@/lib/calendar-export";

// Subscribable calendar feed with every match: https://<site>/calendar.ics
// Google / Apple / Outlook re-download it periodically, so new or changed
// matches show up in people's calendars automatically.
export const dynamic = "force-dynamic";

export async function GET() {
  const matches = await getMatches();

  return new Response(buildSeasonIcs(matches), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="yakite-pichove.ics"',
      // let Vercel's CDN serve it for 5 min, so many subscribers don't hit the DB
      "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
