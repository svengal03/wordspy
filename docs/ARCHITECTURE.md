# PlayHub — Architecture

## Overview

PlayHub is a Turborepo monorepo with a single Next.js application (`src/`) that hosts all party games under one deployment. Shared primitives (design tokens, UI components, word packs, game constants, game registry) live in workspace packages consumed by the app.

All games run client-side first — game logic is pure TypeScript with no database dependency. Wordspy adds an optional online layer via **Supabase** (Realtime channels + Postgres) for multi-device play. Every other game is pass-the-phone only.

---

## Monorepo Structure

```
playhub/
├── src/                    ← Single Next.js app (@playhub/app) — all games live here
│   ├── app/
│   │   ├── page.tsx        ← PlayHub home — lists all games (reads from @playhub/config)
│   │   ├── layout.tsx
│   │   ├── {game}/         ← One Next.js route per game (e.g. /wordspy, /mafia)
│   │   │   ├── page.tsx    ← Thin wrapper: just renders <{Game}Game />
│   │   │   └── layout.tsx  ← Sets page title / favicon per game
│   │   └── api/            ← API routes for online mode (Wordspy only)
│   ├── games/
│   │   ├── {game}/         ← All game logic + UI for one game
│   │   │   ├── types.ts    ← GameState, GameConfig, Player/Team, DEFAULT_CONFIG
│   │   │   ├── engine.ts   ← Pure game-logic functions (no React, no side effects)
│   │   │   ├── store.ts    ← Zustand store: { game, set, reset }
│   │   │   ├── {Game}Game.tsx ← Phase switcher — renders one screen per phase
│   │   │   ├── index.ts    ← Re-exports {Game}Game
│   │   │   └── components/ ← One screen component per game phase + RulesModal + ui.tsx
│   │   └── shared/         ← Cross-game screens: TeamAssignScreen, TeamSetupScreen, WordReveal
│   ├── lib/                ← App-level utilities (api.ts, supabase.ts, scoringUtils.ts, etc.)
│   ├── hooks/              ← App-level React hooks
│   └── public/favicons/    ← Per-game favicons
├── packages/
│   ├── config/             ← @playhub/config — GAMES registry array (game metadata for home)
│   ├── core/               ← @playhub/core — types, word packs, game constants, difficulty
│   └── ui/                 ← @playhub/ui — RevealCover, PlayerNameInput, CategoryPicker, tokens, Btn
├── database/               ← Supabase schema, RLS policies, seed data, migrations
├── docs/
│   ├── ARCHITECTURE.md     ← This file
│   ├── GAMEPLAY.md         ← Overview of all games with links to per-game docs
│   ├── gameplay/           ← Deep-dive per-game docs
│   │   ├── WORDSPY.md
│   │   ├── MAFIA.md
│   │   ├── PICTIONARY.md
│   │   └── DUMBCHARADES.md
│   └── NEW_GAME.md         ← End-to-end guide for adding a new game
├── turbo.json
└── package.json            ← Workspaces: ["src", "packages/*"]
```

All games are deployed together as a single Vercel project. Adding a new game means adding a route under `src/app/{game}/` and a game module under `src/games/{game}/`.

---

## App Architecture Patterns

### Pattern A — Pass-Phone Local (Mafia, Pictionary, Dumb Charades)

Single device. State lives in React (Zustand or useState). No network calls during gameplay. State resets on page refresh.

```
Single device (pass-the-phone)

  React state (Zustand or useState)
    → game logic in src/games/{game}/engine.ts (pure functions)
    → {Game}Game.tsx renders one screen component per phase
    → no network calls during gameplay

  No Supabase. No API routes. No persistence.
```

### Pattern B — Online + Offline (Wordspy only)

```
  VERCEL
  ┌───────────────────┐  ┌─────────────────────────────┐
  │  Next.js Frontend │  │  API Routes                 │
  │  React + Zustand  │  │  src/app/api/rooms/         │
  │  src/games/wordspy│  │  src/app/api/packs/         │
  └────────┬──────────┘  └─────────────────────────────┘
           │ Realtime WebSocket
  ┌────────▼──────────────────────────────────────────────┐
  │  SUPABASE                                              │
  │  • Postgres: rooms table (game state stored as JSON)   │
  │  • Realtime: broadcasts state changes to all clients   │
  └────────────────────────────────────────────────────────┘
```

Online mode: game state is persisted in Supabase (Postgres) and broadcast via Supabase Realtime channels. Every player action runs a pure engine function → API route writes updated state → Realtime delivers full state snapshot to all connected players.

Offline mode: same game logic, state lives in Zustand on device, no network calls.

---

## Per-App Summary

| Game | Mode | State | Realtime | Players |
|---|---|---|---|---|
| `wordspy` | Online + Offline | Zustand + Supabase Postgres | Supabase Realtime | 3–10 |
| `mafia` | Offline only | Zustand | None | 5–15 |
| `pictionary` | Offline only | useState | None | 4+ (teams) |
| `dumbcharades` | Offline only | useState | None | 4+ (teams) |
| `wavelength` | Offline only | Zustand | None | 4+ (teams) |

---

## File Structure Per Game

Every game follows this structure under `src/games/{game}/`:

| File / Folder | Purpose |
|---|---|
| `{Game}Game.tsx` | Phase switcher — renders one screen component per `GameState.phase` value |
| `types.ts` | All types: `GameState`, `GameConfig`, `Player`/`Team` + `DEFAULT_CONFIG` |
| `engine.ts` | All game logic as pure functions — no React, no side effects |
| `store.ts` | Zustand store: `{ game, set, reset }` |
| `index.ts` | Re-exports `{Game}Game` for use in `src/app/{game}/page.tsx` |
| `components/` | One component per game phase + `RulesModal.tsx` + `ui.tsx` (local tokens, Btn, Card, Screen, TopBar) |

App route files (under `src/app/{game}/`):

| File | Purpose |
|---|---|
| `page.tsx` | Thin wrapper: `import { {Game}Game } from "@/games/{game}"; return <{Game}Game />;` |
| `layout.tsx` | Sets `<title>` and favicon for this game |

Pattern B (online) apps also have API routes:

| File | Purpose |
|---|---|
| `src/app/api/rooms/route.ts` | Create / get / update rooms — reads/writes Supabase |
| `src/app/api/packs/route.ts` | Fetch word packs from Supabase |

---

## Shared Packages

### `@playhub/config`

Located at `packages/config/src/`. Consumed by the app's home page.

Exports:
- `GAMES: GameConfig[]` — the authoritative list of all games with metadata (slug, name, emoji, description, players, themeColor, steps). **The home page (`src/app/page.tsx`) reads directly from this array.**
- `GameConfig` type

**To register a new game, add an entry to `packages/config/src/games.ts`.** This is the only place needed to make a game appear on the home screen.

### `@playhub/core`

Located at `packages/core/src/`. Consumed by all games.

Exports:
- Generic `Player`, `Room`, `GamePhase` types
- Word packs with paired words (`{ civilian, undercover }` per entry) and word lists
- Difficulty constants and point values
- Timer options (60s / 90s / 120s)
- Team color palettes — one palette per game type

Available word packs: `bollywood` (Hindi cinema 2000–2025), `tollywood` (Telugu/Tamil cinema 2000–2025), `south-food`, `north-food`.

### `@playhub/ui`

Located at `packages/ui/src/`. Consumed by all games.

| Component | Purpose |
|---|---|
| `RevealCover` | Pass-the-phone cover card for private role/word reveals |
| `CategoryPicker` | Word pack selector grid (multi-select) |
| `PlayerNameInput` | Inline name input with add button |
| `tokens` | Design tokens (colors, spacing, radii) |
| `Btn` | Primary button component |

---

## UI Conventions (all games)

All games share the same visual language:

| Rule | Value |
|---|---|
| Font | DM Sans (Google Fonts, display=swap) |
| Primary color | Coral `#CC785C` |
| Background | `#FAFAF8` |
| Card style | White, 20px border-radius, 1.5px border `#F0F0F0` |
| Animations | Framer Motion — fade-up on mount, `whileTap` scale 0.97 |
| Layout | Max 480px centered, mobile-first |
| Screen structure | `<Screen>` → `<TopBar>` → content → `<Btn variant="primary" fullWidth>` at bottom |
| Required on every screen | TopBar with game logo + `RulesModal` trigger |

Each game's local `components/ui.tsx` defines `Screen`, `TopBar`, `Card`, `Btn`, and the game logo. Copy from `src/games/mafia/components/ui.tsx` and update only the logo name string.

---

## Adding a New Game

See `docs/NEW_GAME.md` for the complete end-to-end guide.

Quick order:
1. Write `docs/gameplay/{GAME_NAME}.md` — rules, phases, types, config
2. Add entry to `packages/config/src/games.ts`
3. Add `src/app/{game}/page.tsx` + `layout.tsx`
4. Add `src/games/{game}/` — types → engine → store → `{Game}Game.tsx` → components

---

## Security

- Supabase service key is server-only (API routes) — never reaches the browser bundle
- Client uses the Supabase anon key with Row Level Security (RLS) enforced — see `database/rls.sql`
- No user accounts — no PII stored anywhere
- Room codes expire after 4 hours

## Performance

- No DB calls during gameplay — all state via Supabase Realtime or local Zustand
- Full state snapshots (not deltas) — simpler code, small payload per event
- Wordspy room expiry: handled by Supabase TTL / cron job — see `database/schema.sql`
