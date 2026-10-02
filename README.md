volleyball-tracker/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                  # landing: calendar + tiles (reads via lib/)
│   ├── login/page.tsx
│   ├── change-password/page.tsx
│   ├── matches/page.tsx          # full list / past results
│   ├── polls/page.tsx
│   ├── admin/page.tsx            # admin-only match & poll management
│   └── api/                      # HTTP layer only, thin
│       ├── auth/[...all]/route.ts   # Better Auth handler
│       ├── matches/route.ts
│       ├── matches/[id]/route.ts
│       ├── polls/route.ts
│       ├── polls/[id]/route.ts
│       └── votes/route.ts
├── components/                   # existing + MatchCard, PollCard
├── lib/                          # server logic, no Next UI imports
│   ├── env.ts                    # validates env vars (zod)
│   ├── db.ts                     # Drizzle connection
│   ├── auth.ts                   # Better Auth config
│   ├── auth-client.ts
│   ├── session.ts                # requireUser(), requireAdmin()
│   ├── services/
│   │   ├── matches.ts
│   │   ├── polls.ts
│   │   └── votes.ts
│   └── validation/               # zod schemas
│       ├── match.ts
│       └── poll.ts
├── db/
│   ├── schema.ts                 # tables
│   └── seed/
│       ├── dev.ts                # dummy data
│       └── prod.ts               # real initial data
├── drizzle/                      # generated migrations (commit these)
├── scripts/
│   └── create-user.ts
├── types/
│   ├── match.ts
│   └── poll.ts
├── public/
├── docker-compose.yml            # local Postgres
├── drizzle.config.ts
├── .env.example                  # committed, no real values
├── .env.local                    # git-ignored
└── package.json