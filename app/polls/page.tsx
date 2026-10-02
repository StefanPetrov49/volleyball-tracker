import { requireUser } from "@/lib/session";

export default async function PollsPage() {
  const session = await requireUser();
  return (
    <main className="container">
      <h1>Анкети</h1>
      <p>Здравей, {session.user.name}.</p>
    </main>
  );
}