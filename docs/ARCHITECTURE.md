# PlayHub — Architecture

## Overview

PlayHub is a Turborepo monorepo with a single Next.js application (`src/`) that hosts all party games under one deployment. Shared primitives (design tokens, UI components, word packs, game constants, game registry) live in workspace packages consumed by the app.

All games run client-side first — game logic is pure TypeScript with no database dependency. Two games (Wordspy, Mind Field) add an online layer via **Supabase** (Realtime channels + Postgres) for multi-device play. The rest are pass-the-phone only.

---

## Monorepo Structure

```
playhub/
├── src/                    ← Single Next.js app (@playhub/app) — all games live here
│   ├── app/
│   │   ├── page.tsx        ← PlayHub home — lists all games (reads from @playhub/config)
│   │   ├── layout.tsx
│   │   ├── {game}/         ← One Next.js route per game (e.g. /wordspy, /mafia)
│   │   │   ├── page.tsx    ← Thin wrapper: renders <{Game}Game /> (offline) or <HomeScreen /> (online)
│   │   │   ├── layout.tsx  ← Sets page title / favicon per game via Metadata API
│   │   │   └── room/[id]/  ← Online games only: shareable join URL
│   │   └── api/            ← API routes for online mode (Wordspy, Mind Field)
│   │       ├── rooms/      ← Legacy shared namespace (Wordspy)
│   │       ├── packs/      ← Word pack fetch
│   │       └── {game}/     ← Per-game namespace (preferred — Mind Field)
│   │           └── rooms/[id]/{state,start,...}
│   ├── games/
│   │   ├── {game}/         ← All game logic + UI for one game
│   │   │   ├── types.ts    ← GameState, GameConfig, Player/Team, DEFAULT_CONFIG
│   │   │   ├── engine.ts   ← Pure game-logic functions (Patterns B and C)
│   │   │   ├── store.ts    ← Zustand store (Patterns B and C)
│   │   │   ├── {Game}Game.tsx ← Phase switcher
│   │   │   ├── HomeScreen.tsx ← (online only) entry: create-room / join-room chooser
│   │   │   ├── RoomGame.tsx   ← (online only) multi-device room shell
│   │   │   ├── useRoom.ts     ← (online only) Supabase Realtime subscription
│   │   │   ├── index.ts    ← Re-exports the entry component
│   │   │   └── components/ ← One screen component per phase + RulesModal + ui.tsx
│   │   └── shared/         ← Cross-game screens: TeamSetupScreen, TeamAssignScreen, WordReveal
│   ├── lib/                ← App-level utilities (api.ts, supabase.ts, scoringUtils.ts, etc.)
│   ├── server/             ← Server-only code
│   │   ├── supabase.ts     ← Service-role client (never bundled to client)
│   │   └── db/             ← Typed DB helpers used by API routes
│   ├── hooks/              ← App-level React hooks
│   └── public/favicons/    ← Per-game favicons
├── packages/
│   ├── config/             ← @playhub/config — GAMES + GAME_BY_SLUG registry
│   ├── core/               ← @playhub/core — types, word packs, constants, difficulty
│   └── ui/                 ← @playhub/ui — all shared UI primitives (see Shared Packages)
├── database/               ← Supabase schema, RLS policies, seed data, migrations
├── docs/
│   ├── ARCHITECTURE.md     ← This file
│   ├── GAMEPLAY.md         ← Overview of all games with links to per-game docs
│   ├── gameplay/           ← Deep-dive per-game docs
│   │   ├── WORDSPY.md
│   │   ├── MAFIA.md
│   │   ├── PICTIONARY.md
│   │   ├── DUMBCHARADES.md
│   │   ├── WAVELENGTH.md
│   │   └── MINDFIELD.md
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

### Pattern B — Online (Wordspy, Mind Field)

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
| `mindfield` | Online | Zustand + Supabase Postgres | Supabase Realtime broadcast + ETag polling | 4–16 (2 teams) |
| `mafia` | Offline only | Zustand | None | 5–15 |
| `pictionary` | Offline only | useState | None | 4+ (teams) |
| `dumbcharades` | Offline only | useState | None | 4+ (teams) |
| `wavelength` | Offline only | Zustand | None | 4–12 (2 teams) |

---

## File Structure Per Game

Every game follows this structure under `src/games/{game}/`:

| File / Folder | Purpose |
|---|---|
| `{Game}Game.tsx` | Phase switcher — renders one screen component per `GameState.phase` value |
| `types.ts` | All types: `GameState`, `GameConfig`, `Player`/`Team` + `DEFAULT_CONFIG` |
| `engine.ts` | Pure game-logic functions (Patterns B and C only) |
| `store.ts` | Zustand store (Patterns B and C only) — shape varies; see `mafia/store.ts` vs `mindfield/store.ts` |
| `index.ts` | Re-exports the entry component used by `src/app/{game}/page.tsx` |
| `components/` | One component per game phase + `RulesModal.tsx` + `ui.tsx` (**game-specific atoms only** — see Shared Packages) |
| `HomeScreen.tsx` | Online only: create-room / join-room entry |
| `RoomGame.tsx` | Online only: multi-device room shell (phase switcher for the online flow) |
| `useRoom.ts` | Online only: Supabase Realtime subscription + ETag snapshot fetch |

App route files (under `src/app/{game}/`):

| File | Purpose |
|---|---|
| `page.tsx` | Thin wrapper: `import { {Game}Game } from "@/games/{game}"; return <{Game}Game />;` |
| `layout.tsx` | Sets `<title>` and favicon for this game |

Pattern B (online) apps also have API routes. Two conventions exist; **use the per-game namespace for new games**:

| File | Purpose | Convention |
|---|---|---|
| `src/app/api/packs/route.ts` | Fetch word packs from Supabase | Shared |
| `src/app/api/rooms/route.ts` | Wordspy: create / get / update rooms | Legacy (Wordspy only) |
| `src/app/api/rooms/[id]/state/route.ts` | Wordspy: state snapshot read/write | Legacy (Wordspy only) |
| `src/app/api/{game}/rooms/route.ts` | Create rooms for `{game}` | **Preferred** (Mind Field) |
| `src/app/api/{game}/rooms/[id]/state/route.ts` | State snapshot with ETag support | **Preferred** |
| `src/app/api/{game}/rooms/[id]/start/route.ts` | Transition from lobby to playing | **Preferred** |
| `src/app/api/{game}/rooms/[id]/{action}/route.ts` | Per-game actions (reveal, vote, …) | **Preferred** |

All routes import from `@/server/db/...` and use the service-role Supabase client from `src/server/supabase.ts`. The service-role key never reaches the browser bundle.

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

Available built-in word packs in `@playhub/core`: `bollywood` (Hindi cinema 2000–2025), `tollywood` (Telugu/Tamil cinema 2000–2025), `south-food`, `north-food`. Mind Field has its own per-game packs (`general`, `cricket`, `hyderabad`, `college-life`) stored in Supabase via the `word_packs` table.

### `@playhub/ui`

Located at `packages/ui/src/`. Consumed by all games. **All shared UI primitives live here — do not redefine them inside a game's local `components/ui.tsx`.**

Full export list (canonical source: [packages/ui/src/index.tsx](../packages/ui/src/index.tsx)):

| Category | Exports |
|---|---|
| Layout | `Screen`, `TopBar`, `Card`, `Divider`, `SectionLabel` |
| Buttons | `Btn`, `NavBtn` |
| Inputs | `PlayerNameInput`, `Input`, `Toggle` |
| Feedback | `Badge`, `Spinner`, `LoadingScreen`, `EmptyState`, `ErrorBox`, `InfoBox`, `useToast`, `ToastContainer` |
| Modals | `Modal`, `RulesModal`, `ConfirmDialog`, `OptionsMenu` |
| Game-specific | `Avatar`, `RevealCover`, `CategoryPicker`, `PhaseTrail`, `GameLobbyScreen`, `RevealProgressDots`, `PlayHubLogo` |
| Hooks | `useGoHome`, `useToast` |
| Tokens & animations | `tokens`, `fadeUp`, `fadeIn`, `fadeUpReduced`, `stagger` |

A game's local `components/ui.tsx` should only define **game-specific** atoms — the game logo (with `PlayHubLogo appName="…"`) and small badges like `RoleBadge` or `RoundBar`. Reference: [src/games/wordspy/components/ui.tsx](../src/games/wordspy/components/ui.tsx).

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

`Screen`, `TopBar`, `Card`, `Btn` etc. are imported from `@playhub/ui`. A game's local `components/ui.tsx` contains only the game-specific logo wrapper and any tiny game-specific badges — see [src/games/wordspy/components/ui.tsx](../src/games/wordspy/components/ui.tsx) for an example.

---

## Adding a New Game

See `docs/NEW_GAME.md` for the complete end-to-end guide.

Quick order:
1. Write `docs/gameplay/{GAME_NAME}.md` — rules, phases, types, config
2. Add entry to `packages/config/src/games.ts`
3. Add `src/app/{game}/page.tsx` + `layout.tsx`
4. Add `src/games/{game}/` — types → engine → store → `{Game}Game.tsx` → components

---

## Online Game Conventions

Applies to Pattern B games (Wordspy, Mind Field). Mind Field is the canonical reference for new online games.

| Concern | Convention |
|---|---|
| API namespace | `src/app/api/{game}/rooms/...` (per-game). Wordspy's shared `/api/rooms` is legacy. |
| Server-side DB | `src/server/db/{game}.ts` — typed helpers using service-role Supabase client from `src/server/supabase.ts`. |
| Realtime channel | `{game}:${roomId}` — broadcast events trigger client refetch. |
| State sync | Server is source of truth. Client uses ETag (`If-None-Match` → `304`) snapshot fetch; Realtime broadcast is just a "something changed" signal. |
| Optimistic writes | Mutating client actions wrap API calls in a `push()` helper that updates local store immediately and rolls back on error. See [src/games/mindfield/RoomGame.tsx](../src/games/mindfield/RoomGame.tsx). |
| Realtime hook | `useRoom(roomId)` in `src/games/{game}/useRoom.ts` — owns the subscription + snapshot fetch. |
| Room join URL | `/{game}/room/{roomId}` — page at `src/app/{game}/room/[id]/page.tsx`. |
| Database migrations | `database/migrations/00N_{name}.sql` — sequential. Update `database/rls.sql` for any new tables. |
| Word packs | Stored in Supabase `word_packs` / `words` tables. The `word_packs.game` CHECK constraint was dropped in `002_mindfield.sql`, so any game slug is accepted. |

## Environment Variables

Declared in [turbo.json](../turbo.json):

| Var | Scope | Used by |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | `src/lib/supabase.ts`, `src/server/supabase.ts` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Client Supabase client (RLS-enforced reads) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** | `src/server/supabase.ts` — bypasses RLS for API routes |

The service-role key is never imported from any file under `src/app/{game}/`, `src/games/`, or `src/lib/`. Only `src/server/` reads it.

## Security

- Supabase service key is server-only (API routes) — never reaches the browser bundle
- Client uses the Supabase anon key with Row Level Security (RLS) enforced — see `database/rls.sql`
- No user accounts — no PII stored anywhere
- Room codes expire after 4 hours

## Performance

- No DB calls during gameplay — all state via Supabase Realtime or local Zustand
- Full state snapshots (not deltas) — simpler code, small payload per event
- Wordspy room expiry: handled by Supabase TTL / cron job — see `database/schema.sql`
