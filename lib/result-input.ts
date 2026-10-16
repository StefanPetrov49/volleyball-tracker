import { inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { teams } from "@/db/schema";
import { sofiaLocalToDate } from "@/lib/datetime";
import { toYouTubeEmbed } from "@/lib/youtube";

export type ResultFormState = {
  error?: string;
};

export type ParsedResult = {
  teamAId: number;
  teamBId: number;
  setsWonA: number;
  setsWonB: number;
  sets: { a: number; b: number }[];
  videoUrl: string | null;
  playedAt: Date;
};

export async function parseResultForm(
  formData: FormData,
): Promise<{ error: string } | { data: ParsedResult }> {
  const teamAId = Number(formData.get("teamAId"));
  const teamBId = Number(formData.get("teamBId"));
  const videoRaw = formData.get("videoUrl")?.toString().trim() || "";
  const playedAtRaw = formData.get("playedAt")?.toString() ?? "";

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

  const playedAt = sofiaLocalToDate(playedAtRaw);
  if (!playedAt) {
    return { error: "Избери дата и час на мача." };
  }

  let videoUrl: string | null = null;
  if (videoRaw) {
    videoUrl = toYouTubeEmbed(videoRaw);
    if (!videoUrl) {
      return { error: "Линкът не изглежда като валиден YouTube видео линк." };
    }
  }

  const sets: { a: number; b: number }[] = [];

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

    sets.push({ a, b });
  }

  const setsWonA = sets.filter((s) => s.a > s.b).length;
  const setsWonB = sets.filter((s) => s.b > s.a).length;

  if (sets.length > 0 && setsWonA === setsWonB) {
    return { error: "Резултатът не може да бъде равен." };
  }

  return {
    data: { teamAId, teamBId, setsWonA, setsWonB, sets, videoUrl, playedAt },
  };
}