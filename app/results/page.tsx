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

  const active = results.filter(
    (r) => r.status === "live" || r.status === "upcoming",
  );
  const past = results.filter(
    (r) => r.status !== "live" && r.status !== "upcoming",
  );

  return (
    <PageLayout>
      <header className="results-heading">
        <div className="results-heading-copy">
          <h1>Резултати</h1>
        </div>

        {isAdmin && (
          <Link href="/results/new" className="results-add-button">
            + Нов мач
          </Link>
        )}
      </header>

      {results.length === 0 ? (
        <div className="results-empty">
          <span className="results-empty-icon" aria-hidden="true">🏐</span>
          <h2>Все още няма добавени мачове</h2>
          <p>Предстоящите и изиграните мачове ще се показват тук.</p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className="results-grid">
              {active.map((result) => (
                <MatchResultCard key={result.id} result={result} />
              ))}
            </div>
          )}

          {active.length > 0 && past.length > 0 && (
            <div className="results-divider" role="separator">
              <span>Изиграни мачове</span>
            </div>
          )}

          {past.length > 0 && (
            <div className="results-grid">
              {past.map((result) => (
                <MatchResultCard key={result.id} result={result} />
              ))}
            </div>
          )}
        </>
      )}
    </PageLayout>
  );
}