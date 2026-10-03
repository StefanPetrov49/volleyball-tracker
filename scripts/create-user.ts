import { config } from "dotenv";
import { randomBytes } from "node:crypto";

config({ path: ".env.local", quiet: true });

async function main() {
  const [email, name, role = "user"] = process.argv.slice(2);

  if (!email || !name) {
    console.error('Usage: npm run user:create -- <email> "<name>" [admin|user]');
    process.exit(1);
  }

  const { auth } = await import("../lib/auth");
  const password = randomBytes(9).toString("base64url");

  await auth.api.createUser({
    body: { email, name, password, role: role as "admin" | "user" },
  });

  console.log(`Created ${role}: ${email}`);
  console.log(`Temporary password: ${password}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});