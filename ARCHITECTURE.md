# Project Architecture & Drizzle ORM Reference

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Spring Boot → Next.js Mapping](#spring-boot--nextjs-mapping)
3. [How Drizzle ORM Works (No JPA)](#how-drizzle-orm-works)
4. [Migration System](#migration-system)
5. [Seeds: dev vs prod](#seeds-dev-vs-prod)
6. [Database Connection](#database-connection)
7. [Writing New Features](#writing-new-features)

---

## Project Structure

```
volleyball-tracker/
├── app/                          # Next.js App Router (pages + API)
│   ├── layout.tsx                # Root: AuthProvider, metadata, theme color
│   ├── page.tsx                  # Home: calendar + next match (fetches from lib/)
│   ├── login/page.tsx            # Login via Better Auth
│   ├── change-password/page.tsx  # Password reset flow
│   ├── matches/page.tsx          # Full match list (future)
│   ├── polls/page.tsx            # Active polls page
│   └── admin/page.tsx            # Admin-only: manage matches & polls
│   └── api/                      # Thin HTTP layer (route.ts files)
│       ├── auth/[...all]/route.ts   # Better Auth handler
│       ├── matches/route.ts          # GET all matches
│       ├── matches/[id]/route.ts     # GET single match (future)
│       ├── polls/route.ts            # CRUD polls (GET/POST)
│       └── votes/route.ts            # Cast/reassign votes
├── components/                   # Client-side UI (Tailwind CSS)
│   ├── AuthModal.tsx             # Login/registration modal
│   ├── NavUser.tsx               # Conditional login/logout + username display
│   ├── Schedule.tsx              # Calendar view of matches
│   ├── NextMatch.tsx             # Upcoming match highlight card
│   └── ... (polls, footer, tiles...)
├── lib/                          # Server logic ONLY (no Next UI imports)
│   ├── env.ts                    # Validates env vars (Zod)
│   ├── db.ts                     # Drizzle connection pool
│   ├── auth.ts                   # Better Auth config + API handlers
│   ├── session.ts                # requireUser() / requireAdmin() guards
│   └── services/                 # Pure DB queries (your "Service" layer)
│       ├── matches.ts            # getMatches(), getMatchById()
│       └── polls.ts              # getPolls(), createPoll(), castVote(), addWinnerToCalendar()
│   └── validation/               # Zod schemas (DTO validation)
│       ├── match.ts              # Match input schema
│       └── poll.ts               # Poll input schema
├── db/                           # Drizzle schema + migrations
│   ├── schema.ts                 # Table definitions (your "Entity" / DAO definitions)
│   └── seed/                     # Data seeding scripts
│       ├── dev.ts                # Dummy data (wipes existing, localhost only)
│       └── prod.ts               # Real initial data (safe, no wipe)
├── drizzle/                      # Auto-generated migrations (commit these)
│   ├── meta/                     # Migration journal & snapshots
│   │   ├── 0000_snapshot.json     # Snapshot after first migration
│   │   ├── 0001_snapshot.json     # Snapshot after second
│   │   └── _journal.json         # Tracks which migrations applied
│   └── 000X_*.sql                # Actual migration scripts (auto-generated)
├── scripts/                      # Utility scripts
│   └── create-user.ts            # Admin bootstrap
├── types/                        # TypeScript interfaces (your "DTO" types)
│   ├── match.ts                  # Match interface
│   └── poll.ts                   # Poll + PollOption interfaces
├── public/                       # Static assets (logo.svg, og-image.png)
├── .env.local                    # Git-ignored: DATABASE_URL for localhost only
└── docker-compose.yml            # Local Postgres container (postgres:16)
```

---

## Spring Boot → Next.js Mapping

| Spring Boot | This Project | Notes |
|---|---|---|
| `@RestController` + method annotation | `app/api/<path>/route.ts` | Each file = one endpoint. Method signature = HTTP method (`export async function GET()`) |
| `@Service` | `lib/services/<name>.ts` | Pure business logic + DB queries. **No Next imports here.** |
| `@Repository` / JPA DAO class | Drizzle queries inline in service files | **No separate class needed.** `db.select()`, `db.insert()` ARE your DAO calls. |
| `@Entity` / JPA mappings | Drizzle `pgTable()` in `db/schema.ts` | Declares columns with types. Drizzle generates SQL automatically. |
| `@Validated` / DTO validation | Zod schemas in `lib/validation/` | `.safeParse(req.json())` validates input before hitting service. |
| `EntityManagerFactory` + connection pooling | Singletons in `lib/db.ts` via `Pool` | One shared pool per process. Drizzle wraps it with type safety. |
| `@Transactional` | `.transaction(async (tx) => { ... })` | Explicit block for multi-step operations. |
| Flyway SQL migrations | Drizzle JSON snapshots in `drizzle/` | Generated from schema code, not written by hand. |

---

## How Drizzle ORM Works

### Core Concept: No JPA, Just Typed SQL Queries

Drizzle is **not** an ORM like JPA/Hibernate. It's a **type-safe query builder**.

```ts
// Spring Boot (JPA):
matchRepository.findById(id)  // → EntityManager.find()

// This project (Drizzle):
db.select().from(matches).where(eq(matches.id, id))  // → parameterized SQL query
```

### The `db` Object (Your "EntityManager")

Located at `lib/db.ts`:
```ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({ connectionString: env.DATABASE_URL, max: 5 });
export const db = drizzle(pool, { schema });
```

- `Pool` = connection pool (5 max connections), shared via `globalForDb.pool`
- `drizzle(pool, { schema })` = wraps the pool with your table definitions for type safety
- **You import `db` directly in any service file.** No injection needed.

### Querying (Your "Repository" Calls)

```ts
// GET ALL matches, ordered by date/time ascending:
const rows = await db.select().from(matches).orderBy(asc(matches.date), asc(matches.time));

// GET SINGLE match by ID:
const [row] = await db.select().from(matches).where(eq(matches.id, id));

// INSERT:
await db.insert(matches).values({ date: "2026-10-04", opponent: "Цунами" });

// UPDATE:
await db.update(matches).set({ scoreUs: 3, scoreThem: 1 }).where(eq(matches.id, id));

// DELETE:
await db.delete(matches).where(eq(matches.id, id));
```

### Transaction (Your `@Transactional`)

Multi-step operations that must succeed or fail together:
```ts
// Example from lib/services/polls.ts — create poll + its options atomically:
await db.transaction(async (tx) => {
  const [poll] = await tx.insert(polls).values({ question: "Q?", createdBy: userId }).returning();
  await tx.insert(pollOptions).values(options.map(o => ({ pollId: poll.id, ...o })));
});
```

Key difference from JPA: **You explicitly pass `tx` (not `EntityManager`) to every query inside the transaction.**

---

## Migration System

### How It Works

```
1. You define tables in db/schema.ts            ← Your "DDL" (like Flyway SQL)
2. Run: npm run db:migrate                   ← Auto-generates migration files in drizzle/
3. Drizzle creates a JSON-based migration       ← Auto-calculates what changed
4. Run: npm run db:migrate                   ← Applies migrations against DB
```

### The `drizzle/meta/` Directory

| File | Purpose |
|---|---|
| `0000_snapshot.json` | Snapshot of the DB schema after first migration |
| `0001_snapshot.json` | Snapshot after second migration |
| `_journal.json` | Tracks which migrations have been applied (prevents re-running) |

### The `drizzle/` Directory (Migration Scripts)

Drizzle auto-generates SQL-based migration files:
```
drizzle/
├── 0000_...sql    ← First migration (e.g., create tables)
├── 0001_...sql    ← Second migration (e.g., add column)
└── ...            ← Auto-generated, sequential numbering
```

### Adding a New Column (e.g., `videoUrl` on `matches`)

**Step 1:** Add the field in your schema:
```ts
// db/schema.ts
export const matches = pgTable("matches", {
  id: uuid("id").primaryKey().defaultRandom(),
  date: date("date", { mode: "string" }).notNull(),
  time: time("time"),
  opponent: text("opponent").notNull(),
  location: text("location"),
  home: boolean("home").notNull().default(true),
  scoreUs: integer("score_us"),
  scoreThem: integer("score_them"),
  videoUrl: text("video_url"),        // ← NEW FIELD
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

**Step 2:** Generate the migration:
```bash
npm run db:migrate    # Creates new .sql file in drizzle/ AND applies it to the DB
```

**Step 3:** Commit the `drizzle/` folder. These are your "migration files" (equivalent to Flyway scripts).

---

## Seeds: dev vs prod

### Why Two Seeds?

| Script | Command | Behavior | Safe for Production? |
|---|---|---|---|
| `dev` seed | `npm run seed:dev` | **Wipes** all data, inserts dummy data | ❌ No — only on localhost |
| `prod` seed | `npm run seed:prod` | Checks if data exists, inserts only if empty | ✅ Yes — but still manual |

### What Each Does

**`db/seed/dev.ts`:**
```ts
await db.delete(matches);       // ← WIPES THE TABLE
await db.delete(polls);         // ← WIPES EVERYTHING
// ... inserts dummy data
```

**`db/seed/prod.ts`:**
```ts
const existing = await db.select().from(matches).limit(1);
if (existing.length > 0) {       // ← SAFE: checks first
  console.log("matches already has data, skipping.");
  process.exit(0);
}
// ... inserts default matches
```

### The Safety Gate for prod:
```ts
if (!url || url.includes("localhost")) {
  throw new Error("seed:prod needs a non-local DATABASE_URL");
}
```

---

## Database Connection

### How It Works

| Component | Purpose |
|---|---|
| `docker-compose.yml` | Local Postgres 16 container (postgres:16, user: volley) |
| `lib/db.ts` | Shared connection pool (5 max), wrapped in Drizzle for type safety |
| `.env.local` | Git-ignored. Set `DATABASE_URL=postgres://volley:volley@localhost:5432/volleyball` |

### Environment-Specific Configs

```
.env.local              → localhost dev (git-ignored)
.env.development        → shared dev server (if any, git-ignored)
.env.production         → production (set on deploy host only, git-ignored)
```

### ⚠️ NEVER: Point your local DATABASE_URL to production

The dev seed **deletes all tables**. A migration could also have side effects. Always use environment-specific env files:

```bash
# Local dev:
export DATABASE_URL=postgres://volley:volley@localhost:5432/volleyball

# Production (set on the deploy host, NEVER in .env.local):
DATABASE_URL=postgresql://user:pass@prod-host/volleyball

# Command-line override (safe, not committed):
DATABASE_URL=postgres://... npm run db:migrate
```

---

## Writing New Features (Step-by-Step)

### Example: Add a YouTube embed field to matches

#### 1. Update the schema (your "Entity" definition)
```ts
// db/schema.ts — add field to existing table
export const matches = pgTable("matches", {
  // ... existing columns ...
  videoUrl: text("video_url"),    // ← new column
});
```

#### 2. Generate & apply migration (your "Flyway" step)
```bash
npm run db:migrate
git add drizzle/          # Commit the generated migration
```

#### 3. Add service method (your "Service" layer)
```ts
// lib/services/matches.ts
export async function getMatchById(id: string): Promise<Match | null> {
  const [row] = await db.select().from(matches).where(eq(matches.id, id));
  if (!row) return null;
  return {
    id: row.id,
    date: row.date,
    time: hhmm(row.time),
    opponent: row.opponent,
    location: row.location,
    home: row.home,
    scoreUs: row.scoreUs,
    scoreThem: row.scoreThem,
    videoUrl: row.videoUrl,   // ← return the new field
  };
}
```

#### 4. Add API route (your "Controller")
```ts
// app/api/matches/[id]/route.ts
import { NextResponse } from "next/server";
import { getMatchById } from "@/lib/services/matches";

export async function GET(_, { params }) {
  const match = await getMatchById(params.id);
  if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(match);
}
```

#### 5. Add the page (your "View")
```ts
// app/matches/[id]/page.tsx
import { getMatchById } from "@/lib/services/matches";

export default async function MatchDetailPage({ params }) {
  const match = await getMatchById(params.id);

  if (!match) return <NextResponse.json({ error: "Not found" }, { status: 404 });

  return (
    <main className="container">
      <h1>Мач: {match.opponent}</h1>

      {/* YouTube embed */}
      {match.videoUrl && (
        <iframe src={`https://www.youtube.com/embed/${extractVideoId(match.videoUrl)}`}
          width="100%" height="225" allowFullScreen />
      )}

      <details>
        <summary>Резултат</summary>
        {match.scoreUs !== null && match.scoreThem !== null && (
          <p>Мы: {match.scoreUs} — Сопротивник: {match.scoreThem}</p>
        )}
      </details>

      <p>📅 {match.date}</p>
    </main>
  );
}

function extractVideoId(url: string): string {
  const m = url.match(/(?:v|youtu\.be)\/([^?&]+)/);
  return m?.[1] ?? "";
}
```

#### 6. Link from list pages (navigate to detail)
```tsx
// In NextMatch.tsx or Schedule component:
<Link href={`/matches/${match.id}`}>
  <div className="match-card">
    <h3>{match.opponent}</h3>
    <p>{match.date} {match.time}</p>
  </div>
</Link>
```

---

## Quick Reference: Useful Commands

| Command | What It Does |
|---|---|
| `npm run dev` | Start Next.js dev server (localhost:3000) |
| `npm run db:up` | Start local Postgres via docker-compose |
| `npm run db:down` | Stop local Postgres |
| `npm run db:migrate` | Generate & apply migrations |
| `npm run db:studio` | Open Drizzle Studio (visual migration editor) |
| `npm run seed:dev` | Seed dummy data on localhost (wipes tables) |
| `npm run seed:prod` | Seed real initial data on production (safe, no wipe) |
| `npm run user:create` | Create a new admin user (interactive prompt) |

---
