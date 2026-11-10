import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import UsersAdmin from "@/components/UsersAdmin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Играчи" };

type PageProps = { searchParams: Promise<{ new?: string }> };

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const session = await requireAdmin();
  const { new: openNew } = await searchParams;
  return (
    <main className="container">
      <UsersAdmin currentUserId={session.user.id} openNewForm={openNew === "1"} />
    </main>
  );
}
