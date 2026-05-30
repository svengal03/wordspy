# PlayHub

Turborepo monorepo hosting all party games as a single Next.js app. No accounts, no sign-up — pass the phone and play.

---

## Games

| App | Description | Players | Mode |
|---|---|---|---|
| 🕵️ **Wordspy** | Social deduction word game — find allies, expose infiltrators | 3–10 | Online + Offline |
| 🔪 **Mafia** | Hidden Mafia vs the town — night kills, day votes | 5–15 | Offline |
| 🎨 **Pictionary** | Draw it, guess it — team competition with difficulty tiers | 4+ | Offline |
| 🎬 **Dumb Charades** | Act it out silently — Bollywood and more | 4+ | Offline |
| 🧠 **Mind Field** | Two-team word deduction — Spymasters give clues, agents tap words | 4–16 | Online |
| 〰️ **Wavelength** | Two teams, one spectrum dial — guide your team to the target | 4–12 | Offline |

---

## Getting Started

### Install

```bash
npm install
```

### Run

```bash
npm run dev
```

App starts at `localhost:3000`.

### Environment

All offline games work with no env vars. Wordspy's online (multi-device) mode and Wavelength's spectrum packs require Supabase.

Create `src/.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Get these from your Supabase project → Settings → API. Apply the schema from `database/schema.sql` and RLS policies from `database/rls.sql`.

---

## Structure

```
playhub/
├── src/                    ← Single Next.js app — all games live here
│   ├── app/
│   │   ├── page.tsx        ← PlayHub home (reads from @playhub/config)
│   │   ├── layout.tsx
│   │   ├── template.tsx
│   │   ├── {game}/         ← One route per game (/wordspy, /mafia, etc.)
│   │   │   ├── page.tsx    ← Thin wrapper: renders <{Game}Game />
│   │   │   └── layout.tsx  ← Sets title + favicon per game
│   │   └── api/            ← API routes (Wordspy online mode)
│   ├── games/
│   │   ├── {game}/         ← All logic + UI for one game
│   │   │   ├── types.ts
│   │   │   ├── engine.ts   ← Pure game-logic functions
│   │   │   ├── store.ts    ← Zustand store
│   │   │   ├── {Game}Game.tsx
│   │   │   ├── index.ts
│   │   │   └── components/
│   │   └── shared/         ← Cross-game screens
│   ├── lib/                ← Supabase client, scoring utils, etc.
│   ├── hooks/
│   └── public/favicons/    ← Per-game favicons
├── packages/
│   ├── config/             ← @playhub/config — GAMES registry (home screen)
│   ├── core/               ← @playhub/core — types, word packs, constants
│   └── ui/                 ← @playhub/ui — RevealCover, CategoryPicker, PlayerNameInput, Btn
├── database/               ← Supabase schema, RLS policies, seed data
└── docs/
    ├── ARCHITECTURE.md
    ├── GAMEPLAY.md
    ├── NEW_GAME.md
    └── gameplay/           ← Per-game design docs
```

---

## Tech Stack

| | |
|---|---|
| Framework | Next.js 15 (App Router) |
| Monorepo | Turborepo + npm workspaces |
| State | Zustand (Mafia, Wordspy, Wavelength) · useState (Pictionary, Dumb Charades) |
| Realtime | Supabase Realtime — Wordspy online mode only |
| Database | Supabase Postgres — Wordspy rooms + Wavelength word packs |
| Animations | Framer Motion |
| Font | DM Sans |
| Deployment | Vercel — single project |

---

## Adding a New Game

Read `docs/NEW_GAME.md` for the full end-to-end flow. Short version:

1. Describe the game to Claude Code — rules, players, phases
2. Claude writes `docs/gameplay/{GAME}.md` — review and confirm it
3. Claude scaffolds the full app from `src/games/mafia` and implements all files
4. Claude registers the game in `packages/config/src/games.ts` and updates the docs

---

## Deploy

Single Vercel project — all games ship together. Set the Supabase env vars in the Vercel project settings.

Wordspy's online mode uses Supabase Realtime. For multi-region Supabase deployments, rooms expire after 4 hours via a scheduled Supabase function — see `database/schema.sql`.

---

## License

MIT
