import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import { getMatches } from "@/lib/services/matches";
import MatchesAdmin from "@/components/MatchesAdmin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Мачове" };

export default async function AdminMatchesPage() {
  await requireAdmin();
  const matches = await getMatches();
  return (
    <main className="container">
      <MatchesAdmin matches={matches} />
    </main>
  );
}