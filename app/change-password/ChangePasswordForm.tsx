"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { changePasswordAction } from "./actions";

export default function ChangePasswordForm() {
  const router = useRouter();
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
    setPending(false);
    if (res.error) return setError(res.error);
    router.push("/polls");
    router.refresh();
  }

  return (
    <form className="auth-card" onSubmit={onSubmit}>
      <h1>Смяна на парола</h1>
      <label>Текуща парола<input name="current" type="password" required autoComplete="current-password" /></label>
      <label>Нова парола (мин. 10 символа)<input name="next" type="password" required minLength={10} autoComplete="new-password" /></label>
      {error && <p className="auth-error">{error}</p>}
      <button type="submit" disabled={pending}>{pending ? "Запазване..." : "Запази"}</button>
    </form>
  );
}