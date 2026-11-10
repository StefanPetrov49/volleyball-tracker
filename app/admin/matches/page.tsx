import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import { getMatches, OUR_TEAM_SLUG, splitUpcomingPast } from "@/lib/services/matches";
import { getTeams } from "@/lib/teams";
import MatchesAdmin from "@/components/MatchesAdmin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Мачове" };

export default async function AdminMatchesPage() {
  await requireAdmin();
  const [matches, teams] = await Promise.all([getMatches(), getTeams()]);
  const { upcoming, past } = splitUpcomingPast(matches);
  // opponents for the dropdown: every team except us
  const opponents = teams.filter((t) => t.slug !== OUR_TEAM_SLUG).map((t) => t.name);

  return (
    <main className="container">
      <MatchesAdmin upcoming={upcoming} past={past} opponents={opponents} />
    </main>
  );
}
