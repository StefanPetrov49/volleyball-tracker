"use client";
import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const err = mode === "login"
      ? await login(username, password)
      : await register(username, password);
    setLoading(false);
    if (err) { setError(err); return; }
    onClose();
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close" onClick={onClose} aria-label="Затвори">✕</button>
        <div className="auth-tabs">
          <button className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(null); }}>Вход</button>
          <button className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setError(null); }}>Регистрация</button>
        </div>
        <form className="auth-form" onSubmit={submit}>
          <div className="auth-field">
            <label>Потребителско име</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              autoFocus
            />
          </div>
          <div className="auth-field">
            <label>Парола</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
            />
          </div>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "..." : mode === "login" ? "Влез" : "Регистрирай се"}
          </button>
        </form>
      </div>
    </div>
  );
}
