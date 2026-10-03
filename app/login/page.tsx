"use client";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import PasswordInput from "@/components/PasswordInput";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const { error } = await authClient.signIn.email({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    if (error) {
      setPending(false);
      setError("Грешен имейл или парола.");
      return;
    }
    window.location.assign("/");
  }

  return (
    <main className="container">
      <form className="auth-card" onSubmit={onSubmit}>
        <h1>Вход</h1>
        <label>
          Имейл
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>
          Парола
          <PasswordInput name="password" required autoComplete="current-password" />
        </label>
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" disabled={pending}>{pending ? "Влизане..." : "Вход"}</button>
      </form>
    </main>
  );
}