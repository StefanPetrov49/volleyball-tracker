import Schedule from "@/components/Schedule";
import NextMatch from "@/components/NextMatch";
import { getMatches } from "@/lib/services/matches";
import LiveMatchBanner from "@/components/LiveMatchBanner";

export const dynamic = "force-dynamic";

export default async function Home() {
  const matches = await getMatches();

  return (
    <main className="container">
      <LiveMatchBanner />
      <NextMatch matches={matches} />
      <Schedule matches={matches} />
    </main>
  );
}