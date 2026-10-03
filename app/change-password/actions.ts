"use server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/db/schema";

const input = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(5),
});

export async function changePasswordAction(currentPassword: string, newPassword: string) {
  const parsed = input.safeParse({ currentPassword, newPassword });
  if (!parsed.success) {
    return { error: "Новата парола трябва да е поне 5 символа." };
  }

  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) return { error: "Не сте влезли." };

  try {
    await auth.api.changePassword({
      body: { currentPassword, newPassword, revokeOtherSessions: true },
      headers: h,
    });
  } catch {
    return { error: "Текущата парола е грешна." };
  }

  await db.update(user).set({ mustChangePassword: false }).where(eq(user.id, session.user.id));
  return { ok: true };
}