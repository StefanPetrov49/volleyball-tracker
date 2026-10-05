import Schedule from "@/components/Schedule";
import NextMatch from "@/components/NextMatch";
import { getMatches } from "@/lib/services/matches";

export const dynamic = "force-dynamic";

export default async function Home() {
  const matches = await getMatches();

  return (
    <main className="container">
      <NextMatch matches={matches} />
      <Schedule matches={matches} />
    </main>
  );
}