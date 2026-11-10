// Small success/error banners ("✓ Мачът е добавен").
// Call toast() from any client component; <Toaster /> (in the navbar) shows it.

export type ToastKind = "success" | "error";
export type ToastEvent = { message: string; kind: ToastKind };

export const TOAST_EVENT = "app-toast";
/** Cookie a server action sets before redirecting, so the next page shows the banner. */
export const FLASH_COOKIE = "flash";

export function toast(message: string, kind: ToastKind = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ToastEvent>(TOAST_EVENT, { detail: { message, kind } }));
}
