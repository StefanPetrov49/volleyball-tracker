import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const initialMatches = [
  { date: "2026-10-01", time: "21:00", opponent: "Контрола Холестеролни", location: "ХТМУ", home: true },
  { date: "2026-10-04", time: "17:00", opponent: "Цунами", location: "Васил Симов", home: false },
  { date: "2026-10-18", time: "16:00", opponent: "Инкредибалс", location: null, home: true },
  { date: "2026-10-25", time: "19:00", opponent: "Екстрийм Волей", location: "Левски Геритидж", home: false },
];

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  if (!url || url.includes("localhost")) {
    throw new Error("seed:prod needs a non-local DATABASE_URL. Prefix the command with it.");
  }

  const { db } = await import("../../lib/db");
  const { matches } = await import("../schema");

  const existing = await db.select({ id: matches.id }).from(matches).limit(1);
  if (existing.length > 0) {
    console.log("matches already has data, skipping.");
    process.exit(0);
  }

  await db.insert(matches).values(initialMatches);
  console.log(`Inserted ${initialMatches.length} matches.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});