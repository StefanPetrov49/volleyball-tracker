import fs from "fs";
import path from "path";

function filePath(name: string) {
  return path.join(process.cwd(), "data", name);
}

export function readJson<T>(name: string, fallback: T): T {
  try {
    const file = filePath(name);
    const raw = fs.readFileSync(file, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(name: string, data: T): void {
  try {
    const file = filePath(name);
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf-8");
  } catch {
    // Vercel and other read-only environments can't persist writes
    console.warn(`[fileStore] writeJson failed for ${name} — filesystem may be read-only`);
  }
}
