import Link from "next/link";
import { notFound } from "next/navigation";
import PageLayout from "@/components/PageLayout";
import ResultForm from "../../new/ResultForm";
import { updateMatchResult, deleteMatchResult } from "./actions";
import { requireAdmin } from "@/lib/session";
import { getTeams } from "@/lib/teams";
import { getMatchResult } from "@/lib/results";
import { dateToSofiaLocal } from "@/lib/datetime";
import { getScheduleOptions } from "@/lib/services/matches";
import DeleteResultButton from "./DeleteResultButton";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditResultPage({ params }: PageProps) {
  await requireAdmin();

  const { id } = await params;
  const [result, teams, scheduleOptions] = await Promise.all([
    getMatchResult(Number(id)),
    getTeams(),
    getScheduleOptions(),
  ]);

  if (!result) notFound();

  return (
    <PageLayout>
      <Link href={`/results/${result.id}`} className="back-link">
        ← Обратно към мача
      </Link>

      <header className="results-heading">
        <div className="results-heading-copy">
          <p className="results-eyebrow">АДМИНИСТРАЦИЯ</p>
          <h1>Редактиране на мач</h1>
        </div>
      </header>

      <ResultForm
        teams={teams}
        scheduleOptions={scheduleOptions}
        currentResultId={result.id}
        action={updateMatchResult.bind(null, result.id)}
        submitLabel="Запази промените"
        initial={{
          teamAId: String(result.teamAId),
          teamBId: String(result.teamBId),
          playedAt: dateToSofiaLocal(result.playedAt),
          videoUrl: result.videoUrl ?? "",
          matchId: result.matchId ?? "",
          sets: result.sets.map((s) => ({ a: String(s.a), b: String(s.b) })),
        }}
      />

      <div className="result-danger-zone">
        <DeleteResultButton action={deleteMatchResult.bind(null, result.id)} />
      </div>
    </PageLayout>
  );
}