import { NextResponse } from "next/server";
import { readJson } from "@/lib/fileStore";
import type { Match } from "@/data/matches";

export async function GET() {
  const matches = readJson<Match[]>("matches.json");
  return NextResponse.json(matches);
}
