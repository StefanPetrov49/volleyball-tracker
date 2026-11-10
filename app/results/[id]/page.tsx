import Link from "next/link";
import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageLayout from "@/components/PageLayout";
import MatchResultCard from "@/components/MatchResultCard";
import { getMatchResult } from "@/lib/results";
import { getSession } from "@/lib/session";
import { youtubeWatchUrl } from "@/lib/youtube";
import { resultDescription, resultTitle } from "@/lib/result-meta";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

// cache() so generateMetadata and the page share one DB query per request
const getResult = cache((id: string) => getMatchResult(Number(id)));

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getResult(id);
  if (!result) return { title: "Мачът не е намерен", robots: { index: false } };

  const title = resultTitle(result);
  const description = resultDescription(result);
  const url = `/results/${result.id}`;

  // og:image comes automatically from ./opengraph-image.tsx
  return {
    title: { absolute: `${title} | Яките пичове` },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      siteName: "Яките пичове",
      locale: "bg_BG",
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${url}/opengraph-image`],
    },
  };
}

export default async function MatchResultPage({ params }: PageProps) {
  const { id } = await params;

  const [result, session] = await Promise.all([
    getResult(id),
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