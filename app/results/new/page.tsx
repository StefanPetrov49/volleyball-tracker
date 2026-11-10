import { redirect } from "next/navigation";
import PageLayout from "@/components/PageLayout";
import ResultForm from "./ResultForm";
import { createMatchResult } from "./actions";
import { requireAdmin } from "@/lib/session";
import { getTeams } from "@/lib/teams";
import { nowSofiaLocal } from "@/lib/datetime";
import { getResultPrefill, getScheduleOptions } from "@/lib/services/matches";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type PageProps = { searchParams: Promise<{ matchId?: string }> };

export default async function NewResultPage({ searchParams }: PageProps) {
  await requireAdmin();
  const { matchId } = await searchParams;

  // Opened from "+ Резултат" on a scheduled match → prefill teams, date and link
  const prefill = matchId && UUID_RE.test(matchId) ? await getResultPrefill(matchId) : null;
  if (prefill && "existingResultId" in prefill) redirect(`/results/${prefill.existingResultId}/edit`);

  const [teams, scheduleOptions] = await Promise.all([getTeams(), getScheduleOptions()]);

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
        scheduleOptions={scheduleOptions}
        action={createMatchResult}
        submitLabel="Запази"
        initial={{
          teamAId: prefill?.teamAId ?? "",
          teamBId: prefill?.teamBId ?? "",
          playedAt: prefill?.playedAt ?? nowSofiaLocal(),
          videoUrl: "",
          matchId: prefill?.matchId ?? "",
          sets: [],
        }}
      />
    </PageLayout>
  );
}