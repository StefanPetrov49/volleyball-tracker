"use client";
import { useState } from "react";
import { changePasswordAction } from "./actions";
import PasswordInput from "@/components/PasswordInput";

export default function ChangePasswordForm() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await changePasswordAction(
      String(form.get("current")),
      String(form.get("next"))
    );
    if (res.error) {
      setPending(false);
      setError(res.error);
      return;
    }
    window.location.assign("/");
  }

  return (
    <form className="auth-card" onSubmit={onSubmit}>
      <h1>Смяна на парола</h1>
      <label>
        Текуща парола
        <PasswordInput name="current" required autoComplete="current-password" />
      </label>
      <label>
        Нова парола (мин. 5 символа)
        <PasswordInput name="next" required minLength={5} autoComplete="new-password" />
      </label>
      {error && <p className="auth-error">{error}</p>}
      <button type="submit" disabled={pending}>{pending ? "Запазване..." : "Запази"}</button>
    </form>
  );
}