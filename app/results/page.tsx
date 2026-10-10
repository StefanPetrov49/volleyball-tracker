import Link from "next/link";
import PageLayout from "@/components/PageLayout";
import MatchResultCard from "@/components/MatchResultCard";
import { getMatchResults } from "@/lib/results";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  const [results, session] = await Promise.all([
    getMatchResults(),
    getSession(),
  ]);

  const isAdmin = session?.user.role === "admin";

  return (
    <PageLayout>
      <header className="results-heading">
        <div className="results-heading-copy">
          <h1>Резултати</h1>
        </div>

        {isAdmin && (
          <Link href="/results/new" className="results-add-button">
            + Нов резултат
          </Link>
        )}
      </header>

      {results.length === 0 ? (
        <div className="results-empty">
          <span className="results-empty-icon" aria-hidden="true">🏐</span>
          <h2>Все още няма добавени резултати</h2>
          <p>След като изиграете мач, неговият резултат ще се появи тук.</p>
        </div>
      ) : (
        <div className="results-grid">
          {results.map((result) => (
            <MatchResultCard key={result.id} result={result} />
          ))}
        </div>
      )}
    </PageLayout>
  );
}