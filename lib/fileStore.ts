import fs from "fs";
import path from "path";

function filePath(name: string) {
  return path.join(process.cwd(), "data", name);
}

export function readJson<T>(name: string): T {
  const file = filePath(name);
  const raw = fs.readFileSync(file, "utf-8");
  return JSON.parse(raw) as T;
}

export function writeJson<T>(name: string, data: T): void {
  const file = filePath(name);
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf-8");
}
