import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import UsersAdmin from "@/components/UsersAdmin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Потребители" };

export default async function AdminUsersPage() {
  await requireAdmin();
  return (
    <main className="container">
      <UsersAdmin />
    </main>
  );
}