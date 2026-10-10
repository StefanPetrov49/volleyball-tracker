import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { nextCookies } from "better-auth/next-js";
import { admin, username } from "better-auth/plugins";
import { db } from "./db";
import { user } from "../db/schema";
import { eq } from "drizzle-orm";

export const auth = betterAuth({
    database: drizzleAdapter(db, { provider: "pg" }),

    emailAndPassword: {
        enabled: true,
        disableSignUp: true,
        minPasswordLength: 5,
    },

    session: {
        expiresIn: 60 * 60 * 24 * 365,
        updateAge: 60 * 60 * 24 * 7,
    },

    user: {
        additionalFields: {
            mustChangePassword: {
                type: "boolean",
                defaultValue: true,
                input: false,
            },
        },
    },

    plugins: [
        admin(),
        username({
            minUsernameLength: 3,
            maxUsernameLength: 30,
        }),
        nextCookies(),
    ],

    onPasswordReset: async (ctx: { user: { id: string } }) => {
        await db
            .update(user)
            .set({ mustChangePassword: true })
            .where(eq(user.id, ctx.user.id));
    },
});