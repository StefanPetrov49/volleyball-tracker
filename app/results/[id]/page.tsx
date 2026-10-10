import Link from "next/link";
import { notFound } from "next/navigation";
import PageLayout from "@/components/PageLayout";
import MatchResultCard from "@/components/MatchResultCard";
import { getMatchResult } from "@/lib/results";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function MatchResultPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getMatchResult(Number(id));

  if (!result) notFound();

  return (
    <PageLayout>
      <Link href="/results" className="back-link">
        ← Обратно към резултатите
      </Link>

      <MatchResultCard result={result} detailed />
    </PageLayout>
  );
}