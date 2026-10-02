"use client";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/lib/AuthContext";
import AuthModal from "./AuthModal";

export default function NavUser() {
  const { username, logout } = useAuth();
  const [open, setOpen] = useState(false);

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
      <button className="nav-login-btn" onClick={() => setOpen(true)}>Вход / Регистрация</button>
      {open && createPortal(
        <AuthModal onClose={() => setOpen(false)} />,
        document.body
      )}
    </>
  );
}

