import { createAuthClient } from "better-auth/react";
import {
  adminClient,
  inferAdditionalFields,
  usernameClient,
} from "better-auth/client/plugins";
import type { auth } from "./auth";

export const authClient = createAuthClient({
  plugins: [
    adminClient(),
    usernameClient(),
    inferAdditionalFields<typeof auth>(),
  ],
});