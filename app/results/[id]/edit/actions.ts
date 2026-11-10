"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { matchResults } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { parseResultForm, resultSaveError, type ResultFormState } from "@/lib/result-input";
import { logActivity, resultSummary } from "@/lib/services/activity";
import { setFlash } from "@/lib/flash";

export async function updateMatchResult(
  id: number,
  _prevState: ResultFormState,
  formData: FormData,
): Promise<ResultFormState> {
  const session = await requireAdmin();

  if (!Number.isInteger(id)) {
    return { error: "Невалиден мач." };
  }

  const parsed = await parseResultForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  let updated: { id: number }[];
  try {
    updated = await db
      .update(matchResults)
      .set(parsed.data)
      .where(eq(matchResults.id, id))
      .returning({ id: matchResults.id });
  } catch (e) {
    return resultSaveError(e);
  }

  if (updated.length === 0) {
    return { error: "Мачът не е намерен." };
  }

  const s = await resultSummary(parsed.data);
  await logActivity(session.user, "result.updated", s.finished ? `обнови резултата ${s.text}` : `редактира мача ${s.text}`, `/results/${id}`);

  revalidatePath("/");
  revalidatePath("/results");
  revalidatePath(`/results/${id}`);
  await setFlash(s.finished ? "Резултатът е обновен" : "Промените са запазени");
  redirect(`/results/${id}`);
}

export async function deleteMatchResult(id: number) {
  const session = await requireAdmin();

  if (Number.isInteger(id)) {
    const [deleted] = await db.delete(matchResults).where(eq(matchResults.id, id)).returning();
    if (deleted) {
      const s = await resultSummary(deleted);
      await logActivity(session.user, "result.deleted", `изтри мача ${s.text}`, "/results");
    }
  }

  revalidatePath("/results");
  await setFlash("Мачът е изтрит");
  redirect("/results");
}