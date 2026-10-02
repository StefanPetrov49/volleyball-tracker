"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
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
    setPending(false);
    if (error) {
      setError("Грешен имейл или парола.");
      return;
    }
    router.push("/polls");
    router.refresh();
  }

  return (
    <main className="container">
      <form className="auth-card" onSubmit={onSubmit}>
        <h1>Вход</h1>
        <label>Имейл<input name="email" type="email" required autoComplete="email" /></label>
        <label>Парола<input name="password" type="password" required autoComplete="current-password" /></label>
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" disabled={pending}>{pending ? "Влизане..." : "Вход"}</button>
      </form>
    </main>
  );
}