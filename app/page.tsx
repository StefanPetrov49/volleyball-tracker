import Schedule, { type ScheduleView } from "@/components/Schedule";
import NextMatch from "@/components/NextMatch";
import { getMatches } from "@/lib/services/matches";
import LiveMatchBanner from "@/components/LiveMatchBanner";

export const dynamic = "force-dynamic";

const VIEWS: ScheduleView[] = ["calendar", "tiles", "polls", "standings"];

type PageProps = { searchParams: Promise<{ view?: string }> };

export default async function Home({ searchParams }: PageProps) {
  const [matches, { view }] = await Promise.all([getMatches(), searchParams]);
  const initialView = VIEWS.find((v) => v === view) ?? "calendar";

  return (
    <main className="container">
      <LiveMatchBanner />
      <NextMatch matches={matches} />
      <Schedule matches={matches} initialView={initialView} />
    </main>
  );
}