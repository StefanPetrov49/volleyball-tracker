import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { nextCookies } from "better-auth/next-js";
import { admin, username } from "better-auth/plugins";
import { db } from "./db";
import { user } from "../db/schema";
import { eq } from "drizzle-orm";
import { createAuthMiddleware, isAPIError } from "better-auth/api";
import { logActivity } from "./services/activity";

// Admin actions done through Better Auth's own endpoints (from /admin/users) → "Последни промени"
const LOGGED_ADMIN_ACTIONS: Record<string, (name: string, body: Record<string, unknown>) => [string, string]> = {
    "/admin/set-role": (name, body) =>
        body.role === "admin" ? ["user.made_admin", `направи ${name} админ`] : ["user.removed_admin", `махна админ правата на ${name}`],
    "/admin/ban-user": (name) => ["user.deactivated", `деактивира ${name}`],
    "/admin/unban-user": (name) => ["user.reactivated", `активира отново ${name}`],
    "/admin/set-user-password": (name) => ["user.password_reset", `даде нова парола на ${name}`],
};

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

    hooks: {
        after: createAuthMiddleware(async (ctx) => {
            const describe = LOGGED_ADMIN_ACTIONS[ctx.path];
            if (!describe || isAPIError(ctx.context.returned)) return; // not logged, or it failed
            const actor = ctx.context.session?.user;
            const body = (ctx.body ?? {}) as Record<string, unknown>;
            if (!actor || typeof body.userId !== "string") return;
            const [target] = await db.select({ name: user.name }).from(user).where(eq(user.id, body.userId)).limit(1);
            const [action, summary] = describe(target?.name ?? "потребител", body);
            await logActivity({ id: actor.id, name: actor.name }, action, summary, "/admin/users");
        }),
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