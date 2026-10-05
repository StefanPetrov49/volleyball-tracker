import { config } from "dotenv";
import { randomBytes } from "node:crypto";
import { z } from "zod";

config({ path: ".env.local", quiet: true });

const usernameSchema = z
    .string()
    .trim()
    .toLowerCase()
    .regex(
        /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/,
        "Username може да съдържа малки латински букви, цифри, точка, тире и долна черта.",
    )
    .min(3)
    .max(30);

async function main() {
    const [rawUsername, name, role = "user"] = process.argv.slice(2);

    const parsedUsername = usernameSchema.safeParse(rawUsername);

    if (!parsedUsername.success || !name) {
        console.error(
            'Usage: npm run user:create -- <username> "<name>" [admin|user]\nExample: npm run user:create -- stefan.petrov "Стефан Петров" admin',
        );
        process.exit(1);
    }

    if (role !== "admin" && role !== "user") {
        console.error('Role must be either "admin" or "user".');
        process.exit(1);
    }

    const username = parsedUsername.data;
    const email = `${username}@yakite-pichove.local`;
    const password = randomBytes(9).toString("base64url");

    const { auth } = await import("../lib/auth");

    await auth.api.createUser({
        body: {
            email,
            name,
            password,
            role,
            data: {
                username,
                displayUsername: username,
            },
        },
    });

    console.log(`Created ${role}: ${username} (${name})`);
    console.log(`Temporary password: ${password}`);
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});