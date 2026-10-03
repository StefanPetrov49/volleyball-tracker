"use client";
import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import PasswordInput from "./PasswordInput";

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const err = await login(email, password);
    setLoading(false);
    if (err) { setError(err); return; }
    onClose();
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close" onClick={onClose} aria-label="Затвори">✕</button>
        <div className="auth-tabs">
          <button type="button" className="active">Вход</button>
        </div>
        <form className="auth-form" onSubmit={submit}>
          <div className="auth-field">
            <label>Имейл</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              autoFocus
            />
          </div>
          <div className="auth-field">
            <label>Парола</label>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "..." : "Влез"}
          </button>
          <p className="auth-hint">Нямаш акаунт? Поискай от админа на отбора.</p>
        </form>
      </div>
    </div>
  );  
}