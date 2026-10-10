"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { matchResults, teams } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

export type ResultFormState = {
  error?: string;
};

function toYouTubeEmbed(raw: string): string | null {
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "");
    let id: string | null = null;

    if (host === "youtu.be") {
      id = url.pathname.slice(1);
    } else if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") id = url.searchParams.get("v");
      else if (url.pathname.startsWith("/embed/")) id = url.pathname.split("/")[2];
      else if (url.pathname.startsWith("/shorts/")) id = url.pathname.split("/")[2];
    }

    return id && /^[\w-]{6,}$/.test(id)
      ? `https://www.youtube.com/embed/${id}`
      : null;
  } catch {
    return null;
  }
}

export async function createMatchResult(
  _prevState: ResultFormState,
  formData: FormData,
): Promise<ResultFormState> {
  await requireAdmin();

  const teamAId = Number(formData.get("teamAId"));
  const teamBId = Number(formData.get("teamBId"));
  const videoRaw = formData.get("videoUrl")?.toString().trim() || "";
  const playedAt = formData.get("playedAt")?.toString();

  if (!Number.isInteger(teamAId) || !Number.isInteger(teamBId)) {
    return { error: "Избери и двата отбора." };
  }

  if (teamAId === teamBId) {
    return { error: "Отборите трябва да са различни." };
  }

  const found = await db
    .select({ id: teams.id })
    .from(teams)
    .where(inArray(teams.id, [teamAId, teamBId]));

  if (found.length !== 2) {
    return { error: "Избран е несъществуващ отбор." };
  }

  let videoUrl: string | null = null;
  if (videoRaw) {
    videoUrl = toYouTubeEmbed(videoRaw);
    if (!videoUrl) {
      return { error: "Линкът не изглежда като валиден YouTube видео линк." };
    }
  }

  const setScores: { a: number; b: number }[] = [];

  for (let i = 1; i <= 5; i++) {
    const aRaw = formData.get(`set${i}A`)?.toString();
    const bRaw = formData.get(`set${i}B`)?.toString();

    if (!aRaw && !bRaw) continue;

    if (!aRaw || !bRaw) {
      return { error: `Попълни резултата и за двата отбора в сет ${i}.` };
    }

    const a = Number(aRaw);
    const b = Number(bRaw);

    if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0) {
      return { error: `Невалиден резултат за сет ${i}.` };
    }

    if (a === b) {
      return { error: `Сет ${i} не може да завърши наравно.` };
    }

    setScores.push({ a, b });
  }

  if (setScores.length === 0) {
    return { error: "Добави поне един сет." };
  }

  const setsWonA = setScores.filter((s) => s.a > s.b).length;
  const setsWonB = setScores.filter((s) => s.b > s.a).length;

  if (setsWonA === setsWonB) {
    return { error: "Резултатът не може да бъде равен." };
  }

  await db.insert(matchResults).values({
    teamAId,
    teamBId,
    setsWonA,
    setsWonB,
    sets: setScores,
    videoUrl,
    playedAt: playedAt ? new Date(playedAt) : new Date(),
  });

  revalidatePath("/results");
  redirect("/results");
}