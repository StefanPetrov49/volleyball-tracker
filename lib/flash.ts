import { cookies } from "next/headers";
import { FLASH_COOKIE } from "./toast";

/**
 * From a server action, right before redirect(): the next page shows this as a banner.
 * Short-lived and readable by the page (it's only a message, nothing secret).
 */
export async function setFlash(message: string) {
  // Next.js URL-encodes cookie values itself; the Toaster decodes them
  (await cookies()).set(FLASH_COOKIE, message, {
    path: "/",
    maxAge: 30,
    sameSite: "lax",
    httpOnly: false,
  });
}
