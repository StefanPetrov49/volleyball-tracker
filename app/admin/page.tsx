import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/session";
import { getAdminOverview } from "@/lib/services/admin-overview";
import { monthShortBg, parseMatchDate } from "@/lib/datetime";
import type { Match } from "@/types/match";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Админ" };

// ---------- small helpers ----------

/** "vs Легендите · 11 ное" */
const matchLabel = (m: Match) => {
  const d = parseMatchDate(m.date);
  return `vs ${m.opponent} · ${d.getDate()} ${monthShortBg(d.getMonth())}`;
};

/** First two items, then "и още N" */
const listPreview = (items: string[]) =>
  items.length <= 2 ? items.join(", ") : `${items.slice(0, 2).join(", ")} и още ${items.length - 2}`;

/** Bulgarian plural: plural(1, "мач", "мача") */
const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

// ---------- icons (inline, stroke) ----------

const Icon = ({ d, size = 20, color = "currentColor" }: { d: ReactNode; size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);
const trophy = (
  <>
    <path d="M8 21h8" /><path d="M12 17v4" /><path d="M7 4h10v5a5 5 0 0 1-10 0z" />
    <path d="M17 5h3v2a3 3 0 0 1-3 3" /><path d="M7 5H4v2a3 3 0 0 0 3 3" />
  </>
);
const key = (<><circle cx="8" cy="15" r="4" /><path d="M10.8 12.2L19 4" /><path d="M16 7l2 2" /><path d="M14 9l2 2" /></>);
const pin = (<><path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>);
const check = <path d="M5 12l5 5 9-10" />;
const calendar = (<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18" /><path d="M8 3v4" /><path d="M16 3v4" /></>);
const calendarPlus = (<>{calendar}<path d="M12 13v5" /><path d="M9.5 15.5h5" /></>);
const userPlus = (<><circle cx="9" cy="8" r="4" /><path d="M2 21c0-4 3-6 7-6s7 2 7 6" /><path d="M19 8v6" /><path d="M16 11h6" /></>);
const users = (<><circle cx="9" cy="8" r="4" /><path d="M2 21c0-4 3-6 7-6s7 2 7 6" /><path d="M16 4a4 4 0 0 1 0 8" /><path d="M19 15c2 .8 3 2.6 3 6" /></>);
const megaphone = (<><path d="M8 7l9-4v18l-9-4" /><path d="M8 7H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h3z" /><path d="M6 15l1.5 5h2.5l-1-5" /></>);
const shield = <path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z" />;
const chevron = <Icon d={<path d="M9 6l6 6-6 6" />} size={18} color="#6b6f72" />;

// ---------- page ----------

type Attention = { href: string; icon: ReactNode; tone: "warn" | "info"; title: string; detail: string };

export default async function AdminPage() {
  const session = await requireAdmin();
  const o = await getAdminOverview();
  const firstName = session.user.name.split(" ")[0];

  const attention: Attention[] = [];

  if (o.missingResult.length > 0) {
    const n = o.missingResult.length;
    const only = o.missingResult[0];
    attention.push({
      // one match → straight to its result form; several → the admin list
      href:
        n === 1
          ? only.result ? `/results/${only.result.id}/edit` : `/results/new?matchId=${only.id}`
          : "/admin/matches#played",
      icon: trophy,
      tone: "warn",
      title: `${n} ${plural(n, "изигран мач", "изиграни мача")} без резултат`,
      detail: listPreview(o.missingResult.map(matchLabel)),
    });
  }
  if (o.waitingPassword.length > 0) {
    const n = o.waitingPassword.length;
    attention.push({
      href: "/admin/users",
      icon: key,
      tone: "warn",
      title: `${n} ${plural(n, "играч чака", "играчи чакат")} да ${plural(n, "смени", "сменят")} паролата`,
      detail: listPreview(o.waitingPassword),
    });
  }
  if (o.missingInfo.length > 0) {
    const n = o.missingInfo.length;
    attention.push({
      href: "/admin/matches",
      icon: pin,
      tone: "info",
      title: n === 1 ? "Мач без зала или час" : `${n} мача без зала или час`,
      detail: listPreview(o.missingInfo.map(matchLabel)),
    });
  }

  const playersDetail =
    `${o.players} ${plural(o.players, "играч", "играчи")} · ${o.admins} ${plural(o.admins, "админ", "админи")}` +
    (o.deactivated > 0 ? ` · ${o.deactivated} ${plural(o.deactivated, "деактивиран", "деактивирани")}` : "");

  return (
    <main className="container admin-home">
      <div className="admin-hello">
        <p className="admin-eyebrow">Админ</p>
        <h1>Здравей, {firstName}</h1>
      </div>

      <section className="admin-block" aria-labelledby="attention-title">
        <div className="admin-block-head">
          <h2 id="attention-title">Нужно внимание</h2>
          {attention.length > 0 && <span className="admin-count">{attention.length}</span>}
        </div>

        {attention.length > 0 ? (
          <div className="admin-list">
            {attention.map((a) => (
              <Link key={a.title} href={a.href} className="admin-row">
                <span className={`admin-row-icon ${a.tone}`}>
                  <Icon d={a.icon} />
                </span>
                <span className="admin-row-text">
                  <strong>{a.title}</strong>
                  <span>{a.detail}</span>
                </span>
                {chevron}
              </Link>
            ))}
          </div>
        ) : (
          <div className="admin-list admin-all-clear">
            <span className="admin-row-icon info">
              <Icon d={check} />
            </span>
            <span className="admin-row-text">
              <strong>Всичко е наред</strong>
              <span>Няма мачове без резултат или пропуснати данни.</span>
            </span>
          </div>
        )}
      </section>

      <section className="admin-block" aria-labelledby="quick-title">
        <h2 id="quick-title">Бързи действия</h2>
        <div className="admin-tiles">
          <Link href="/admin/matches" className="admin-tile">
            <span className="admin-tile-icon"><Icon d={calendarPlus} color="#fff" /></span>
            <strong>Нов мач</strong>
          </Link>
          <Link href="/results/new" className="admin-tile">
            <span className="admin-tile-icon"><Icon d={trophy} color="#fff" /></span>
            <strong>Нов резултат</strong>
          </Link>
          <Link href="/admin/users?new=1" className="admin-tile">
            <span className="admin-tile-icon"><Icon d={userPlus} color="#fff" /></span>
            <strong>Нов играч</strong>
          </Link>
          <div className="admin-tile is-soon" aria-disabled="true">
            <span className="admin-tile-icon"><Icon d={megaphone} color="#fff" /></span>
            <span className="admin-tile-label">
              <strong>Обява</strong>
              <span className="admin-soon">скоро</span>
            </span>
          </div>
        </div>
      </section>

      <section className="admin-block" aria-labelledby="manage-title">
        <h2 id="manage-title">Управление</h2>
        <div className="admin-list">
          <Link href="/admin/matches" className="admin-row">
            <Icon d={calendar} size={22} />
            <span className="admin-row-text">
              <strong>Мачове</strong>
              <span>{o.upcomingCount} предстоящи · {o.pastCount} изиграни</span>
            </span>
            {chevron}
          </Link>
          <Link href="/results" className="admin-row">
            <Icon d={trophy} size={22} />
            <span className="admin-row-text">
              <strong>Резултати</strong>
              <span>
                {o.played} {plural(o.played, "наш мач", "наши мача")} · {o.wins} {plural(o.wins, "победа", "победи")}
              </span>
            </span>
            {chevron}
          </Link>
          <Link href="/admin/users" className="admin-row">
            <Icon d={users} size={22} />
            <span className="admin-row-text">
              <strong>Играчи и достъп</strong>
              <span>{playersDetail}</span>
            </span>
            {chevron}
          </Link>
          <div className="admin-row is-soon" aria-disabled="true">
            <Icon d={shield} size={22} />
            <span className="admin-row-text">
              <strong>
                Отбори <span className="admin-soon">скоро</span>
              </strong>
              <span>Имена и логота на противниците</span>
            </span>
          </div>
        </div>
      </section>

      <Link href="/" className="admin-back">
        <Icon d={<path d="M15 6l-6 6 6 6" />} size={18} />
        Към сайта
      </Link>
    </main>
  );
}
