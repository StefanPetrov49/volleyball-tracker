import { NextResponse } from "next/server";
import { getMatches } from "@/lib/services/matches";

export async function GET() {
  return NextResponse.json(await getMatches());
}