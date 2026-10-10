import PageLayout from "@/components/PageLayout";
import ResultForm from "./ResultForm";
import { requireAdmin } from "@/lib/session";
import { getTeams } from "@/lib/teams";

export const dynamic = "force-dynamic";

export default async function NewResultPage() {
  await requireAdmin();
  const teams = await getTeams();

  return (
    <PageLayout>
      <header className="results-heading">
        <div className="results-heading-copy">
          <h1>Нов резултат</h1>
          <p className="results-subtitle">Добави резултат от изигран мач.</p>
        </div>
      </header>

      <ResultForm teams={teams} />
    </PageLayout>
  );
}