import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

async function main() {
  if (!process.env.DATABASE_URL?.includes("localhost")) {
    throw new Error("seed:dev only runs against a localhost database.");
  }

  const { db } = await import("../../lib/db");
  const { matches, polls, pollOptions } = await import("../schema");

  await db.delete(matches);
  await db.delete(polls);

  await db.insert(matches).values([
    { date: "2026-10-04", time: "17:00", opponent: "Цунами", location: null, home: true },
    { date: "2026-10-18", time: "16:00", opponent: "Инкредибалс", location: null, home: true },
  ]);

  const [poll] = await db
    .insert(polls)
    .values({ question: "Кой идва на тренировка в сряда?" })
    .returning();

  await db.insert(pollOptions).values([
    { pollId: poll.id, label: "Идвам", position: 0 },
    { pollId: poll.id, label: "Не мога", position: 1 },
    { pollId: poll.id, label: "Може би", position: 2 },
  ]);

  console.log("Dev data seeded.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});