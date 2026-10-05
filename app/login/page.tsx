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

    const { error } = await authClient.signIn.username({
      username: String(form.get("username")).trim().toLowerCase(),
      password: String(form.get("password")),
    });

    if (error) {
      setPending(false);
      setError("Грешно потребителско име или парола.");
      return;
    }

    window.location.assign("/");
  }

  return (
    <main className="container">
      <form className="auth-card" onSubmit={onSubmit}>
        <h1>Вход</h1>

        <label>
          Потребителско име
          <input
            name="username"
            type="text"
            required
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
          />
        </label>

        <label>
          Парола
          <PasswordInput
            name="password"
            required
            autoComplete="current-password"
          />
        </label>

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" disabled={pending}>
          {pending ? "Влизане..." : "Вход"}
        </button>
      </form>
    </main>
  );
}