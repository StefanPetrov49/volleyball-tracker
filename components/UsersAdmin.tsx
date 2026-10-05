"use client";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

type User = {
    id: string;
    name: string;
    username?: string | null;
    email: string;
    role: string | null;
};

function generatePassword() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let out = "";
    for (let i = 0; i < 11; i++) {
        out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
}

export default function UsersAdmin() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [resetting, setResetting] = useState<{ userId: string; email: string; password: string } | null>(null);
    const [result, setResult] = useState<{ email: string; password: string } | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const { data, error } = await authClient.admin.listUsers({ query: {} });
            if (cancelled) return;
            if (error || !data?.users) {
                setError(error?.message ?? "Неуспешно зареждане.");
                setLoading(false);
                return;
            }
            setUsers(
                data.users.map((u) => {
                    const maybeUsername = u as typeof u & { username?: unknown };

                    return {
                        id: u.id,
                        name: u.name,
                        email: u.email,
                        role: u.role ?? null,
                        username:
                            typeof maybeUsername.username === "string"
                                ? maybeUsername.username
                                : null,
                    };
                }),
            );
            setLoading(false);
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const reset = async (u: User) => {
        const password = generatePassword();
        setResetting({ userId: u.id, email: u.email, password });
        const { error } = await authClient.admin.setUserPassword({ userId: u.id, newPassword: password });
        setResetting(null);
        if (error) {
            setError(error.message ?? "Неуспешна смяна на паролата.");
            return;
        }
        setResult({ email: u.email, password });
    };

    if (loading) {
        return <p>Зареждане на потребителите...</p>;
    }

    return (
        <section className="poll-section">
            <h3>Потребители</h3>
            {error && <p role="alert">{error}</p>}
            {users.length === 0 && <p>Няма потребители.</p>}
            {users.length > 0 && (
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Име</th>
                            <th>Потребителско име</th>
                            <th>Роля</th>
                            <th>Действие</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u.id}>
                                <td>{u.name}</td>
                                <td>{u.username ?? "—"}</td>
                                <td>{u.role === "admin" ? "админ" : "потребител"}</td>
                                <td>
                                    <button
                                        className="poll-add-option-btn"
                                        onClick={() => reset(u)}
                                        disabled={!!resetting}
                                    >
                                        {resetting?.userId === u.id ? "Смяна..." : "Нова парола"}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            {result && (
                <div className="poll-card" style={{ marginTop: 16 }}>
                    <h4>Паролата за {result.email}</h4>
                    <p>
                        Копирай я и я изпрати на човека. Той ще влезе с нея и ще бъде принуден да я смени.
                    </p>
                    <code style={{ display: "block", padding: 8, background: "#f5f5f5", borderRadius: 6 }}>
                        {result.password}
                    </code>
                    <button className="poll-add-option-btn" onClick={() => setResult(null)} style={{ marginTop: 8 }}>
                        Затвори
                    </button>
                </div>
            )}
        </section>
    );
}