"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import AuthModal from "./AuthModal";

export default function NavUser() {
  const { username, logout, isPending, mustChangePassword, isAdmin } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mustChangePassword) router.push("/change-password");
  }, [mustChangePassword, router]);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  if (isPending) return null;

  if (username) {
    return (
      <div className="nav-user" ref={menuRef}>
        <button
          className="nav-username"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          👤 {username} ▾
        </button>
        {menuOpen && (
          <div className="nav-menu" role="menu">
            {isAdmin && (
              <>
                <Link href="/admin/matches" className="nav-menu-item" role="menuitem" onClick={() => setMenuOpen(false)}>
                  Добави Мач
                </Link>
                <Link href="/admin/users" className="nav-menu-item" role="menuitem" onClick={() => setMenuOpen(false)}>
                  Нова парола
                </Link>
              </>
            )}
            <button className="nav-menu-item" role="menuitem" onClick={logout}>
              Изход
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <button className="nav-login-btn" onClick={() => setOpen(true)}>Вход</button>
      {open && createPortal(<AuthModal onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}