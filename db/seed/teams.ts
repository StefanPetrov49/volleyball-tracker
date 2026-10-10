import { db } from "../../lib/db";
import { teams } from "../schema";

const data = [
  { name: "Заря", slug: "zarya" },
  { name: "БарБароните", slug: "barbaronite" },
  { name: "Чуковете", slug: "chukovete" },
  { name: "Extreme Volley", slug: "extreme-volley" },
  { name: "Сокол", slug: "sokol" },
  { name: "Легендите", slug: "legendite" },
  { name: "Владо волей", slug: "vlado-volley" },
  { name: "Бенковски", slug: "benkovski" },
  { name: "Alfa Volley", slug: "alfa-volley" },
  { name: "Ахил-волей (м)", slug: "ahil-volley-m" },
  { name: "Яките пичове", slug: "yakite-pichove" },
  { name: "StormBreakers", slug: "stormbreakers" },
  { name: "Светците", slug: "svetcite" },
  { name: "КСВ", slug: "ksv" },
  { name: "Холестеролни лъвове", slug: "holesterolni-lavove" },
  { name: "Нова Звезда", slug: "nova-zvezda" },
  { name: "The Incrediballs", slug: "the-incrediballs" },
];

async function main() {
  await db
    .insert(teams)
    .values(
      data.map((team) => ({
        ...team,
        logoUrl: `/teams/${team.slug}.png`,
      })),
    )
    .onConflictDoNothing();

  console.log(`Seeded ${data.length} teams.`);
}

main()
  .catch((error) => {
    console.error("Failed to seed teams:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    process.exit();
  }); 