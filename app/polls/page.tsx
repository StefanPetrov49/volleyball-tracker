import PollSection from "@/components/PollSection";
import { requireUser } from "@/lib/session";

export default async function PollsPage() {
  await requireUser();
  return (
    <main className="container">
      <h1>Анкети</h1>
      <PollSection />
    </main>
  );
}