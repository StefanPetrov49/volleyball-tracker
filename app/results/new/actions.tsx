"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { matchResults } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { parseResultForm, type ResultFormState } from "@/lib/result-input";

export async function createMatchResult(
  _prevState: ResultFormState,
  formData: FormData,
): Promise<ResultFormState> {
  await requireAdmin();

  const parsed = await parseResultForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  await db.insert(matchResults).values(parsed.data);

  revalidatePath("/results");
  redirect("/results");
}