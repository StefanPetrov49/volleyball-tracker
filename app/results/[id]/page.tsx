import Link from "next/link";
import { notFound } from "next/navigation";
import PageLayout from "@/components/PageLayout";
import MatchResultCard from "@/components/MatchResultCard";
import { getMatchResult } from "@/lib/results";
import { getSession } from "@/lib/session";
import { youtubeWatchUrl } from "@/lib/youtube";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function MatchResultPage({ params }: PageProps) {
  const { id } = await params;

  const [result, session] = await Promise.all([
    getMatchResult(Number(id)),
    getSession(),
  ]);

  if (!result) notFound();

  const isAdmin = session?.user.role === "admin";

  return (
    <PageLayout>
      <div className="detail-toolbar">
        <Link href="/results" className="back-link">
          ← Обратно към резултатите
        </Link>

        {isAdmin && (
          <Link href={`/results/${result.id}/edit`} className="results-add-button">
            Редактирай
          </Link>
        )}
      </div>

      <MatchResultCard result={result} detailed />

      {result.status === "live" && result.videoUrl && (
        <p className="result-watch-yt">
          <a href={youtubeWatchUrl(result.videoUrl)} target="_blank" rel="noopener noreferrer">
            Отвори в YouTube ↗
          </a>
        </p>
      )}
    </PageLayout>
  );
}