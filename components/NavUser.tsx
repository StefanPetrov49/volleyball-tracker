"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import AuthModal from "./AuthModal";

export default function NavUser() {
  const { username, logout, isPending, mustChangePassword } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (mustChangePassword) router.push("/change-password");
  }, [mustChangePassword, router]);

  if (isPending) return null;

  if (username) {
    return (
      <div className="nav-user">
        <span className="nav-username">👤 {username}</span>
        <button className="nav-logout-btn" onClick={logout}>Изход</button>
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