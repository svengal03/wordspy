# PlayHub — Architecture

## Overview

PlayHub is a Turborepo monorepo hosting independent offline party-game apps. Each app is a standalone Next.js project deployed separately. Shared primitives (design tokens, UI components, word packs, game constants) live in workspace packages consumed by all apps.

All games run client-side first — game logic is pure TypeScript with no database dependency. Wordspy adds an optional online layer via Pusher for multi-device play. Every other game is pass-the-phone only.

---

## Monorepo Structure

```
playhub/
├── apps/
│   ├── home/           ← PlayHub hub — lists all games, links to each
│   ├── wordspy/        ← Social deduction, online + offline
│   ├── mafia/          ← Mafia, offline only
│   ├── pictionary/     ← Pictionary drawing game, offline only
│   └── dumbcharades/   ← Dumb Charades, offline only
├── packages/
│   ├── core/           ← Shared: types, word packs, game constants, difficulty
│   └── ui/             ← Shared: RevealCover, PlayerNameInput, CategoryPicker
├── docs/
│   ├── ARCHITECTURE.md ← This file
│   ├── GAMEPLAY.md     ← Overview of all games with links to per-game docs
│   ├── gameplay/       ← Deep-dive per-game docs
│   │   ├── WORDSPY.md
│   │   ├── MAFIA.md
│   │   ├── PICTIONARY.md
│   │   └── DUMBCHARADES.md
│   └── NEW_GAME.md     ← End-to-end guide for adding a new game
├── turbo.json
└── package.json
```

Each app is independently deployable to Vercel. The `home` app links to every other app via environment variables (`NEXT_PUBLIC_{GAME}_URL`).

---

## App Architecture Patterns

### Pattern A — Pass-Phone Local (Mafia, Pictionary, Dumb Charades)

Single device. State lives in React (Zustand or useState). No network calls during gameplay. State resets on page refresh.

```
Single device (pass-the-phone)

  React state (Zustand or useState)
    → game logic in lib/gameEngine.ts (pure functions)
    → components render based on current phase
    → no network calls during gameplay

  No Pusher. No API routes. No persistence.
```

### Pattern B — Online + Offline (Wordspy only)

```
  VERCEL
  ┌───────────────────┐  ┌─────────────────────┐
  │  Next.js Frontend │  │  API Routes         │
  │  React + Zustand  │  │  /api/pusher-event  │
  │                   │  │  /api/rooms         │
  └────────┬──────────┘  └─────────────────────┘
           │ WebSocket
  ┌────────▼────────────────────────────────────┐
  │  PUSHER — Channel: wordspy-{ROOM_CODE}       │
  │  Broadcasts full GameState snapshots to all  │
  │  connected players on every state change     │
  └─────────────────────────────────────────────┘
```

Online mode: game state lives on the server (in-memory Map) and is broadcast via Pusher. Every action runs a pure function → persists via API route → broadcasts full state snapshot to all connected players.

Offline mode: same game logic, state lives in Zustand on device, no network calls.

---

## Per-App Summary

| App | Mode | State | Realtime | Players |
|---|---|---|---|---|
| `home` | — | None | None | — |
| `wordspy` | Online + Offline | Zustand + Server Map | Pusher | 3–10 |
| `mafia` | Offline only | Zustand | None | 5–15 |
| `pictionary` | Offline only | useState | None | 4+ (teams) |
| `dumbcharades` | Offline only | useState | None | 4+ (teams) |
| `wavelength` | Offline only | Zustand | None | 4–12 (2 teams) |

---

## File Structure Per App

Every game app follows this structure:

| File / Folder | Purpose |
|---|---|
| `app/page.tsx` | Phase switcher — renders one screen component per phase |
| `lib/types.ts` | All types: GameState, GameConfig, Player/Team + DEFAULT_CONFIG |
| `lib/gameEngine.ts` | All game logic as pure functions — no React, no side effects |
| `lib/store.ts` | Zustand store: `{ game, set, reset }` |
| `components/game/` | One component per game phase |
| `components/ui/` | Local tokens, Btn, Card, Screen, TopBar, NavBtn, PlayHubLogo |
| `components/game/RulesModal.tsx` | Full rules, accessible from any screen |
| `package.json` | App name, dev port |
| `next.config.js` | App name, env vars |

Pattern B (online) apps also have:

| File | Purpose |
|---|---|
| `app/api/rooms/route.ts` | Create / get / update rooms in server-side Map |
| `app/api/pusher-event/route.ts` | Server-side Pusher publish (keeps secret keys off the client) |

---

## Shared Packages

### `@playhub/core`

Located at `packages/core/src/`. Consumed by all apps.

Exports:
- Generic Player, Room, GamePhase types
- Word packs with paired words (civilian/undercover) and word lists
- Difficulty constants and point values
- Timer options (60s / 90s / 120s)
- Team color palettes — one palette per game type

Available word packs: `bollywood` (Hindi cinema 2000–2025), `tollywood` (Telugu/Tamil cinema 2000–2025), `south-food`, `north-food`.

### `@playhub/ui`

Located at `packages/ui/src/`. Consumed by wordspy, pictionary, dumbcharades.

| Component | Purpose |
|---|---|
| `RevealCover` | Pass-the-phone cover card for private role/word reveals |
| `CategoryPicker` | Word pack selector grid (multi-select) |
| `PlayerNameInput` | Inline name input with add button |

---

## UI Conventions (all apps)

All apps share the same visual language:

| Rule | Value |
|---|---|
| Font | DM Sans (Google Fonts, display=swap) |
| Primary color | Coral `#CC785C` |
| Background | `#FAFAF8` |
| Card style | White, 20px border-radius, 1.5px border `#F0F0F0` |
| Animations | Framer Motion — fade-up on mount, whileTap scale 0.97 |
| Layout | Max 480px centered, mobile-first |
| Screen structure | `<Screen>` → `<TopBar>` → content → `<Btn variant="primary" fullWidth>` at bottom |
| Required on every screen | TopBar with PlayHubLogo + RulesModal trigger |

---

## Adding a New Game

See `docs/NEW_GAME.md` for the complete end-to-end guide and copy-pasteable AI prompts.

Quick order:
1. Write `docs/gameplay/{GAME_NAME}.md` — rules, phases, types, config
2. Scaffold `apps/{game-name}/` from scratch — read `packages/ui/src/` and `packages/core/src/` first; use Mafia and Wordspy as reference only
3. Implement types → game engine → store → screen components
4. Register in `apps/home`

---

## Security

- Pusher secret keys are server-only — never reach the browser bundle
- No user accounts — no PII stored anywhere
- Room codes expire after 4 hours

## Performance

- No DB calls during gameplay — all state via Pusher or local memory
- Full state snapshots (not deltas) — simpler code, small payload per event
- Wordspy room expiry: in-memory store — use Redis (Upstash) for multi-instance production
