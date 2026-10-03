import { requireAdmin } from "@/lib/session";

export default async function AdminPage() {
  const session = await requireAdmin();
  return (
    <main className="container">
      <h1>Админ</h1>
      <p>Здравей, {session.user.name}.</p>
    </main>
  );
}