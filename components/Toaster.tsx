"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { FLASH_COOKIE, TOAST_EVENT, type ToastEvent, type ToastKind } from "@/lib/toast";

type Item = { id: number; message: string; kind: ToastKind };

const SHOW_MS = 3500;
let nextId = 1;

function takeFlashCookie(): string | null {
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${FLASH_COOKIE}=`));
  if (!match) return null;
  document.cookie = `${FLASH_COOKIE}=; path=/; max-age=0; samesite=lax`; // show it only once
  try {
    return decodeURIComponent(match.slice(FLASH_COOKIE.length + 1));
  } catch {
    return null;
  }
}

/** Banners at the bottom of the screen. Mounted once, in the navbar. */
export default function Toaster() {
  const [items, setItems] = useState<Item[]>([]);
  const pathname = usePathname();

  const dismiss = (id: number) => setItems((list) => list.filter((t) => t.id !== id));

  // banners from toast()
  useEffect(() => {
    const onToast = (e: Event) => {
      const { message, kind } = (e as CustomEvent<ToastEvent>).detail;
      const id = nextId++;
      setItems((list) => [...list.slice(-2), { id, message, kind }]); // at most 3 at once
      window.setTimeout(() => dismiss(id), SHOW_MS);
    };
    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, []);

  // banners left by a server action before it redirected here
  useEffect(() => {
    const t = window.setTimeout(() => {
      const message = takeFlashCookie();
      if (message) window.dispatchEvent(new CustomEvent<ToastEvent>(TOAST_EVENT, { detail: { message, kind: "success" } }));
    }, 0);
    return () => window.clearTimeout(t);
  }, [pathname]);

  return (
    <div className="toaster" role="status" aria-live="polite">
      {items.map((t) => (
        <button key={t.id} type="button" className={`toast toast-${t.kind}`} onClick={() => dismiss(t.id)}>
          <span className="toast-icon" aria-hidden="true">{t.kind === "success" ? "✓" : "!"}</span>
          {t.message}
        </button>
      ))}
    </div>
  );
}
