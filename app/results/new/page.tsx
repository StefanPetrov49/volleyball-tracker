import PageLayout from "@/components/PageLayout";
import ResultForm from "./ResultForm";
import { createMatchResult } from "./actions";
import { requireAdmin } from "@/lib/session";
import { getTeams } from "@/lib/teams";
import { nowSofiaLocal } from "@/lib/datetime";

export const dynamic = "force-dynamic";

export default async function NewResultPage() {
  await requireAdmin();
  const teams = await getTeams();

  return (
    <PageLayout>
      <header className="results-heading">
        <div className="results-heading-copy">
          <p className="results-eyebrow">АДМИНИСТРАЦИЯ</p>
          <h1>Нов мач</h1>
          <p className="results-subtitle">
            Добави предстоящ мач или резултат от изигран.
          </p>
        </div>
      </header>

      <ResultForm
        teams={teams}
        action={createMatchResult}
        submitLabel="Запази"
        initial={{
          teamAId: "",
          teamBId: "",
          playedAt: nowSofiaLocal(),
          videoUrl: "",
          sets: [],
        }}
      />
    </PageLayout>
  );
}