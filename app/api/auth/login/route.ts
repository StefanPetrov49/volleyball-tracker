import { NextResponse } from "next/server";
import { readJson } from "@/lib/fileStore";
import { verifyPassword } from "@/lib/password";
import type { Credential } from "@/data/credentials";

export async function POST(req: Request) {
  const { username, password } = await req.json() as { username: string; password: string };

  const credentials = readJson<Credential[]>("credentials.json", []);
  const user = credentials.find((c) => c.username === username);

  if (!user || !verifyPassword(password, user.password)) {
    return NextResponse.json({ error: "Невалидно потребителско име или парола" }, { status: 401 });
  }

  return NextResponse.json({ username });
}

