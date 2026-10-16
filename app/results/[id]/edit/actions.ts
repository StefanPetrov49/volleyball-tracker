"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { matchResults } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { parseResultForm, type ResultFormState } from "@/lib/result-input";

export async function updateMatchResult(
  id: number,
  _prevState: ResultFormState,
  formData: FormData,
): Promise<ResultFormState> {
  await requireAdmin();

  if (!Number.isInteger(id)) {
    return { error: "Невалиден мач." };
  }

  const parsed = await parseResultForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const updated = await db
    .update(matchResults)
    .set(parsed.data)
    .where(eq(matchResults.id, id))
    .returning({ id: matchResults.id });

  if (updated.length === 0) {
    return { error: "Мачът не е намерен." };
  }

  revalidatePath("/results");
  revalidatePath(`/results/${id}`);
  redirect(`/results/${id}`);
}

export async function deleteMatchResult(id: number, _formData: FormData) {
  await requireAdmin();

  if (Number.isInteger(id)) {
    await db.delete(matchResults).where(eq(matchResults.id, id));
  }

  revalidatePath("/results");
  redirect("/results");
}