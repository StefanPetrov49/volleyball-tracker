"use client";
import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { createPlayer } from "@/app/admin/users/actions";

type User = {
    id: string;
    name: string;
    username?: string | null;
    email: string;
    role: string | null;
    mustChangePassword: boolean;
    banned: boolean;
};

// Temporary password: secure random (Math.random isn't meant for secrets),
// no look-alike characters (0/O, 1/l/I), so it's easy to type from a chat message.
function generatePassword() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    const limit = 256 - (256 % chars.length); // avoids bias towards the first characters
    let out = "";
    while (out.length < 11) {
        const [byte] = crypto.getRandomValues(new Uint8Array(1));
        if (byte < limit) out += chars[byte % chars.length];
    }
    return out;
}

const displayName = (u: { name: string; username?: string | null }) =>
    u.username ? `${u.name} (${u.username})` : u.name;

// "Ана Илиева" → "ana.ilieva" (official Bulgarian transliteration), only a suggestion
const TRANSLIT: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l",
    м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch",
    ш: "sh", щ: "sht", ъ: "a", ь: "y", ю: "yu", я: "ya",
};
const suggestUsername = (name: string) =>
    name
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => [...w].map((ch) => TRANSLIT[ch] ?? ch).join("").replace(/[^a-z0-9]/g, ""))
        .filter(Boolean)
        .join(".");

async function fetchUsers(): Promise<{ users: User[] } | { error: string }> {
    const { data, error } = await authClient.admin.listUsers({ query: {} });
    if (error || !data?.users) return { error: error?.message ?? "Неуспешно зареждане." };
    return {
        users: data.users
            .map((u) => {
                const extra = u as typeof u & { username?: unknown; mustChangePassword?: unknown; banned?: unknown };
                return {
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    role: u.role ?? null,
                    username: typeof extra.username === "string" ? extra.username : null,
                    mustChangePassword: extra.mustChangePassword === true,
                    banned: extra.banned === true,
                };
            })
            // active first, then by name
            .sort((a, b) => Number(a.banned) - Number(b.banned) || a.name.localeCompare(b.name, "bg")),
    };
}

type Result = { kind: "created" | "reset"; name: string; username: string | null; password: string };

const emptyNew = { name: "", username: "", role: "user" as "user" | "admin" };

type Props = {
    currentUserId: string;
    /** /admin/users?new=1 (the "Нов играч" tile) opens the form directly */
    openNewForm?: boolean;
};

export default function UsersAdmin({ currentUserId, openNewForm = false }: Props) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [result, setResult] = useState<Result | null>(null);
    const [copied, setCopied] = useState(false);
    const resultRef = useRef<HTMLDivElement>(null);

    const [showNew, setShowNew] = useState(openNewForm);
    const [newForm, setNewForm] = useState(emptyNew);
    const [usernameTouched, setUsernameTouched] = useState(false);
    const [newError, setNewError] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);

    const applyUsers = (res: Awaited<ReturnType<typeof fetchUsers>>) => {
        if ("error" in res) setError(res.error);
        else setUsers(res.users);
    };

    const loadUsers = async () => applyUsers(await fetchUsers());

    useEffect(() => {
        let cancelled = false;
        fetchUsers().then((res) => {
            if (cancelled) return;
            applyUsers(res);
            setLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    // Bring the new password into view (on phones the list is long)
    useEffect(() => {
        if (result) resultRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, [result]);

    const showResult = (r: Result) => {
        setCopied(false);
        setResult(r);
    };

    const activeAdmins = users.filter((u) => u.role === "admin" && !u.banned).length;

    // ---------- actions ----------

    const resetPassword = async (u: User) => {
        if (!window.confirm(`Нова парола за ${displayName(u)}?\n\nСегашната му парола спира да работи веднага.`)) return;
        const password = generatePassword();
        setBusyId(u.id);
        const { error } = await authClient.admin.setUserPassword({ userId: u.id, newPassword: password });
        setBusyId(null);
        if (error) return setError(error.message ?? "Неуспешна смяна на паролата.");
        setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, mustChangePassword: true } : x)));
        showResult({ kind: "reset", name: u.name, username: u.username ?? null, password });
    };

    const toggleAdmin = async (u: User) => {
        const makeAdmin = u.role !== "admin";
        const question = makeAdmin
            ? `Да направиш ${u.name} админ?\n\nЩе може да добавя мачове, резултати и играчи.`
            : `Да махнеш админ правата на ${u.name}?`;
        if (!window.confirm(question)) return;
        setBusyId(u.id);
        const { error } = await authClient.admin.setRole({ userId: u.id, role: makeAdmin ? "admin" : "user" });
        setBusyId(null);
        if (error) return setError(error.message ?? "Неуспешна промяна на ролята.");
        setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, role: makeAdmin ? "admin" : "user" } : x)));
    };

    const toggleActive = async (u: User) => {
        if (u.banned) {
            if (!window.confirm(`Да активираш отново ${u.name}?`)) return;
        } else if (
            !window.confirm(
                `Да деактивираш ${u.name}?\n\nНяма да може да влиза, а ако е влязъл – ще бъде изписан. Историята му остава и можеш да го активираш отново.`,
            )
        ) {
            return;
        }
        setBusyId(u.id);
        const { error } = u.banned
            ? await authClient.admin.unbanUser({ userId: u.id })
            : await authClient.admin.banUser({ userId: u.id, banReason: "Деактивиран от админ" });
        setBusyId(null);
        if (error) return setError(error.message ?? "Неуспешна промяна.");
        await loadUsers();
    };

    const submitNew = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setNewError(null);
        const res = await createPlayer(newForm);
        setCreating(false);
        if ("error" in res) return setNewError(res.error);
        setShowNew(false);
        setNewForm(emptyNew);
        setUsernameTouched(false);
        await loadUsers();
        showResult({ kind: "created", name: res.name, username: res.username, password: res.password });
    };

    // ---------- copy ----------

    const shareText = (r: Result) =>
        [
            r.kind === "created" ? `Здравей, ${r.name.split(" ")[0]}! Ето профила ти за сайта на отбора:` : `Нова парола за сайта на отбора:`,
            r.username ? `Потребител: ${r.username}` : null,
            `Парола: ${r.password}`,
            `Вход: ${window.location.origin}/login`,
            `При първото влизане ще си избереш своя парола.`,
        ]
            .filter(Boolean)
            .join("\n");

    const copy = async (r: Result) => {
        const text = shareText(r);
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
        } catch {
            window.prompt("Копирай съобщението:", text);
        }
    };

    if (loading) {
        return <p>Зареждане на играчите...</p>;
    }

    return (
        <section className="poll-section">
            <div className="users-head">
                <h3>Играчи и достъп</h3>
                {!showNew && (
                    <button type="button" className="poll-submit-btn" onClick={() => setShowNew(true)}>
                        + Нов играч
                    </button>
                )}
            </div>
            {error && <p role="alert" className="users-error">{error}</p>}

            {showNew && (
                <form className="poll-form users-new" onSubmit={submitNew}>
                    <h3>Нов играч</h3>
                    <div className="poll-form-field">
                        <label htmlFor="new-name">Име и фамилия</label>
                        <input
                            id="new-name"
                            value={newForm.name}
                            onChange={(e) => {
                                const name = e.target.value;
                                setNewForm((f) => ({
                                    ...f,
                                    name,
                                    username: usernameTouched ? f.username : suggestUsername(name),
                                }));
                            }}
                            placeholder="напр. Стефан Петров"
                            required
                            maxLength={60}
                            autoFocus
                        />
                    </div>
                    <div className="poll-form-field">
                        <label htmlFor="new-username">Потребителско име</label>
                        <input
                            id="new-username"
                            value={newForm.username}
                            onChange={(e) => {
                                setUsernameTouched(true);
                                setNewForm((f) => ({ ...f, username: e.target.value.toLowerCase() }));
                            }}
                            placeholder="stefan.petrov"
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck={false}
                            required
                            maxLength={30}
                        />
                        <small className="admin-hint">С него ще влиза. Малки латински букви, цифри и точка.</small>
                    </div>
                    <div className="poll-form-field">
                        <label htmlFor="new-role">Роля</label>
                        <select
                            id="new-role"
                            className="admin-select"
                            value={newForm.role}
                            onChange={(e) => setNewForm((f) => ({ ...f, role: e.target.value as "user" | "admin" }))}
                        >
                            <option value="user">Играч</option>
                            <option value="admin">Админ</option>
                        </select>
                    </div>
                    {newError && <p role="alert" className="users-error">{newError}</p>}
                    <div className="poll-form-actions">
                        <button
                            type="button"
                            className="poll-add-option-btn"
                            onClick={() => {
                                setShowNew(false);
                                setNewError(null);
                            }}
                        >
                            Откажи
                        </button>
                        <button type="submit" className="poll-submit-btn" disabled={creating}>
                            {creating ? "Създаване..." : "Създай профил"}
                        </button>
                    </div>
                </form>
            )}

            {result && (
                <div ref={resultRef} className="poll-card users-result" role="status">
                    <h4>
                        {result.kind === "created" ? `Профилът на ${result.name} е готов` : `Нова парола за ${result.name}`}
                    </h4>
                    <p>
                        Копирай съобщението и му го изпрати. При първото влизане ще си избере своя парола.
                    </p>
                    <pre className="users-password">{shareText(result)}</pre>
                    <div className="poll-form-actions">
                        <button className="poll-submit-btn" onClick={() => copy(result)}>
                            {copied ? "✓ Копирано" : "Копирай съобщението"}
                        </button>
                        <button className="poll-add-option-btn" onClick={() => setResult(null)}>
                            Затвори
                        </button>
                    </div>
                </div>
            )}

            {users.length === 0 && <p>Няма потребители.</p>}
            {users.length > 0 && (
                // Table on wide screens; on phones each row becomes a card (see .users-table in globals.css)
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Име</th>
                            <th>Потребителско име</th>
                            <th>Роля</th>
                            <th>Статус</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => {
                            const isMe = u.id === currentUserId;
                            const isLastAdmin = u.role === "admin" && !u.banned && activeAdmins <= 1;
                            const busy = busyId === u.id;
                            return (
                                <tr key={u.id} className={u.banned ? "users-banned" : undefined}>
                                    <td className="users-name">
                                        {u.name}
                                        {isMe && <span className="users-me"> (ти)</span>}
                                    </td>
                                    <td className="users-username">{u.username ?? "—"}</td>
                                    <td className="users-role">
                                        <span className={`users-badge ${u.role === "admin" ? "admin" : ""}`}>
                                            {u.role === "admin" ? "админ" : "играч"}
                                        </span>
                                    </td>
                                    <td className="users-status">
                                        {u.banned ? "⛔ Деактивиран" : u.mustChangePassword ? "⏳ Чака да смени паролата" : "Активен"}
                                    </td>
                                    <td className="users-action">
                                        <div className="users-buttons">
                                            {!u.banned && (
                                                <button className="poll-add-option-btn" onClick={() => resetPassword(u)} disabled={!!busyId}>
                                                    {busy ? "..." : "Нова парола"}
                                                </button>
                                            )}
                                            {/* never on yourself or the last admin – nobody would be left to manage the site */}
                                            {!isMe && !u.banned && !(isLastAdmin && u.role === "admin") && (
                                                <button className="poll-add-option-btn" onClick={() => toggleAdmin(u)} disabled={!!busyId}>
                                                    {u.role === "admin" ? "Махни админ" : "Направи админ"}
                                                </button>
                                            )}
                                            {!isMe && !isLastAdmin && (
                                                <button
                                                    className={`poll-add-option-btn ${u.banned ? "" : "users-danger"}`}
                                                    onClick={() => toggleActive(u)}
                                                    disabled={!!busyId}
                                                >
                                                    {u.banned ? "Активирай" : "Деактивирай"}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </section>
    );
}
