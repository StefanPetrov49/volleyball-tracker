"use server";

import { randomInt } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { log } from "@/lib/logger";
import { logActivity } from "@/lib/services/activity";

// Same rules as scripts/create-user.ts
const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/, "Потребителското име може да съдържа малки латински букви, цифри, точка, тире и долна черта.")
  .min(3, "Потребителското име трябва да е поне 3 символа.")
  .max(30, "Потребителското име може да е най-много 30 символа.");

const input = z.object({
  name: z.string().trim().min(2, "Въведи име.").max(60),
  username: usernameSchema,
  role: z.enum(["user", "admin"]),
});

// Easy to read and type from a chat message: no 0/O, 1/l/I
const PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
const newPassword = () => Array.from({ length: 11 }, () => PASSWORD_CHARS[randomInt(PASSWORD_CHARS.length)]).join("");

export type CreatePlayerResult =
  | { error: string }
  | { ok: true; name: string; username: string; password: string };

/** "+ Нов играч" – creates an account with a temporary password the player must change on first login. */
export async function createPlayer(raw: { name: string; username: string; role: string }): Promise<CreatePlayerResult> {
  const admin = await requireAdmin();

  const parsed = input.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Невалидни данни." };
  const { name, username, role } = parsed.data;

  const [taken] = await db.select({ id: user.id }).from(user).where(eq(user.username, username)).limit(1);
  if (taken) return { error: `Потребителското име „${username}“ вече е заето.` };

  const password = newPassword();
  try {
    await auth.api.createUser({
      body: {
        email: `${username}@yakite-pichove.local`,
        name,
        password,
        role,
        data: { username, displayUsername: username },
      },
    });
  } catch (e) {
    log.warn("users.create.failed", { actorUserId: admin.user.id, username, reason: e instanceof Error ? e.message : String(e) });
    return { error: "Профилът не беше създаден. Опитай пак." };
  }

  log.info("users.created", { actorUserId: admin.user.id, username, role });
  await logActivity(admin.user, "user.created", `създаде профил на ${name} (${username})${role === "admin" ? " като админ" : ""}`, "/admin/users");
  return { ok: true, name, username, password };
}
