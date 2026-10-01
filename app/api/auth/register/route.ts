import { NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/fileStore";
import { hashPassword } from "@/lib/password";
import type { Credential } from "@/data/credentials";

export async function POST(req: Request) {
  const { username, password } = await req.json() as { username: string; password: string };

  if (!username?.trim() || !password?.trim()) {
    return NextResponse.json({ error: "Потребителското име и паролата са задължителни" }, { status: 400 });
  }

  const credentials = readJson<Credential[]>("credentials.json", []);
  if (credentials.find((c) => c.username === username)) {
    return NextResponse.json({ error: "Потребителят вече съществува" }, { status: 409 });
  }

  credentials.push({ username, password: hashPassword(password) });
  writeJson("credentials.json", credentials);

  return NextResponse.json({ username }, { status: 201 });
}

