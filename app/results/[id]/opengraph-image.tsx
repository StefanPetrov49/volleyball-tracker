import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getMatchResult, type ResultWithTeams } from "@/lib/results";
import { formatResultDate, STATUS_LABEL } from "@/lib/result-meta";

// Preview image shown when /results/<id> is shared (Viber, Messenger, Facebook, etc.)
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Яките пичове – волейболен мач";

const PUBLIC_DIR = join(process.cwd(), "public");
const FONTS_DIR = join(process.cwd(), "assets", "fonts");
const OUR_LOGO = "/teams/yakite-pichove.png";
const DEFAULT_LOGO = "/teams/default.png";

const C = {
  orange: "#f55e1e",
  blue: "#76c1d1",
  charcoal: "#3b3d3e",
  light: "#d5d8d9",
};

/** Reads a logo from public/teams as a data URL; falls back to default.png, then null. */
async function loadLogo(logoUrl: string | null): Promise<string | null> {
  for (const path of [logoUrl, DEFAULT_LOGO]) {
    // only allow files inside public/teams
    if (!path || !/^\/teams\/[a-z0-9-]+\.png$/.test(path)) continue;
    try {
      const file = await readFile(join(PUBLIC_DIR, path));
      return `data:image/png;base64,${file.toString("base64")}`;
    } catch {
      // missing file → try the next option
    }
  }
  return null;
}

function Logo({ src, name, px }: { src: string | null; name: string; px: number }) {
  return (
    <div
      style={{
        width: px,
        height: px,
        borderRadius: px,
        background: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
      }}
    >
      {src ? (
        <img src={src} width={px * 0.82} height={px * 0.82} style={{ objectFit: "contain" }} alt="" />
      ) : (
        <span style={{ fontSize: px * 0.4, fontWeight: 800, color: C.charcoal }}>
          {name.slice(0, 1)}
        </span>
      )}
    </div>
  );
}

function Team({ name, logo, dimmed }: { name: string; logo: string | null; dimmed: boolean }) {
  return (
    <div
      style={{
        width: 300,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
        opacity: dimmed ? 0.6 : 1,
      }}
    >
      <Logo src={logo} name={name} px={210} />
      <span style={{ fontSize: name.length > 16 ? 34 : 42, fontWeight: 800, textAlign: "center", lineHeight: 1.15 }}>
        {name}
      </span>
    </div>
  );
}

function Frame({ ourLogo, children, label }: { ourLogo: string | null; children: React.ReactNode; label?: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "40px 56px",
        color: "#fff",
        fontFamily: "Inter",
        backgroundColor: C.charcoal,
        backgroundImage:
          "radial-gradient(circle at 100% 0%, rgba(245,94,30,0.45) 0%, rgba(245,94,30,0) 45%), radial-gradient(circle at 0% 100%, rgba(118,193,209,0.4) 0%, rgba(118,193,209,0) 45%)",
        borderBottom: `14px solid ${C.orange}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Logo src={ourLogo} name="Я" px={64} />
          <span style={{ fontSize: 30, fontWeight: 800, letterSpacing: 2 }}>ЯКИТЕ ПИЧОВЕ</span>
        </div>
        {label && (
          <span
            style={{
              padding: "10px 24px",
              borderRadius: 999,
              background: label === STATUS_LABEL.live ? C.orange : "rgba(255,255,255,0.12)",
              border: "2px solid rgba(255,255,255,0.25)",
              fontSize: 26,
              fontWeight: 800,
              textTransform: "uppercase",
              color: label === STATUS_LABEL.live ? "#fff" : C.blue,
            }}
          >
            {label}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function MatchCard({ r, logoA, logoB, ourLogo }: { r: ResultWithTeams; logoA: string | null; logoB: string | null; ourLogo: string | null }) {
  const finished = r.status === "finished";
  return (
    <Frame ourLogo={ourLogo} label={STATUS_LABEL[r.status]}>
      {/* top-aligned so both logos sit on the same line even if a name wraps */}
      <div style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "space-between", paddingTop: 44 }}>
        <Team name={r.teamA.name} logo={logoA} dimmed={finished && r.setsWonA < r.setsWonB} />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, marginTop: finished ? 30 : 50 }}>
          <span style={{ fontSize: finished ? 150 : 110, fontWeight: 800, lineHeight: 1 }}>
            {finished ? `${r.setsWonA}:${r.setsWonB}` : "VS"}
          </span>
          {finished && r.sets.length > 0 && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", maxWidth: 480 }}>
              {r.sets.map((s, i) => (
                <span
                  key={i}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    fontSize: 22,
                    fontWeight: 400,
                  }}
                >
                  {`${s.a}:${s.b}`}
                </span>
              ))}
            </div>
          )}
        </div>

        <Team name={r.teamB.name} logo={logoB} dimmed={finished && r.setsWonB < r.setsWonA} />
      </div>

      <div style={{ display: "flex", justifyContent: "center", fontSize: 28, color: C.light }}>
        {formatResultDate(r.playedAt)}
      </div>
    </Frame>
  );
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getMatchResult(Number(id));

  const [regular, bold, ourLogo, logoA, logoB] = await Promise.all([
    readFile(join(FONTS_DIR, "Inter_400Regular.ttf")),
    readFile(join(FONTS_DIR, "Inter_800ExtraBold.ttf")),
    loadLogo(OUR_LOGO),
    result ? loadLogo(result.teamA.logoUrl) : null,
    result ? loadLogo(result.teamB.logoUrl) : null,
  ]);

  return new ImageResponse(
    result ? (
      <MatchCard r={result} logoA={logoA} logoB={logoB} ourLogo={ourLogo} />
    ) : (
      <Frame ourLogo={ourLogo}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64, fontWeight: 800 }}>
          Резултати
        </div>
      </Frame>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter", data: regular, weight: 400, style: "normal" },
        { name: "Inter", data: bold, weight: 800, style: "normal" },
      ],
    },
  );
}
