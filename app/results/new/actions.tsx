"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { matchResults } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { parseResultForm, resultSaveError, type ResultFormState } from "@/lib/result-input";
import { logActivity, resultSummary } from "@/lib/services/activity";
import { setFlash } from "@/lib/flash";

export async function createMatchResult(
  _prevState: ResultFormState,
  formData: FormData,
): Promise<ResultFormState> {
  const session = await requireAdmin();

  const parsed = await parseResultForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  let id: number;
  try {
    [{ id }] = await db.insert(matchResults).values(parsed.data).returning({ id: matchResults.id });
  } catch (e) {
    return resultSaveError(e);
  }

  const s = await resultSummary(parsed.data);
  await logActivity(session.user, s.finished ? "result.created" : "result.match_created", s.finished ? `въведе резултат ${s.text}` : `добави мач ${s.text}`, `/results/${id}`);

  revalidatePath("/");
  revalidatePath("/results");
  await setFlash(s.finished ? "Резултатът е записан" : "Мачът е добавен");
  redirect("/results");
}