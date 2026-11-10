import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import { getRecentActivity } from "@/lib/services/activity";
import ActivityList from "@/components/ActivityList";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Последни промени" };

export default async function ActivityPage() {
  await requireAdmin();
  const rows = await getRecentActivity(100);

  return (
    <main className="container admin-home">
      <Link href="/admin" className="back-link">← Админ</Link>
      <div className="admin-hello">
        <p className="admin-eyebrow">Админ</p>
        <h1>Последни промени</h1>
      </div>
      <div className="admin-list">
        <ActivityList rows={rows} />
      </div>
      <p className="activity-note">Показват се последните 100 промени. По-старите от 180 дни се изтриват автоматично.</p>
    </main>
  );
}
