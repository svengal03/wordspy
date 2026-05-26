# Adding a New Game to PlayHub

End-to-end guide for adding a new game. Read fully before acting.

- Structural standards: [ARCHITECTURE.md](ARCHITECTURE.md)
- Existing per-game designs: [gameplay/](gameplay/)
- Game registry & types: [packages/config/src/games.ts](../packages/config/src/games.ts)
- Shared UI primitives: [packages/ui/src/index.tsx](../packages/ui/src/index.tsx)

---

## What You Produce

| Artifact | Location |
|---|---|
| Game design doc | `docs/gameplay/{GAME_NAME}.md` |
| Game logic + UI | `src/games/{game-name}/` |
| Next.js route | `src/app/{game-name}/page.tsx` + `layout.tsx` |
| Favicon | `src/public/favicons/favicon-{game-name}.svg` |
| Registry entry | `packages/config/src/games.ts` |
| Doc updates | `docs/GAMEPLAY.md` + `docs/ARCHITECTURE.md` |
| **Online only** | DB migration in `database/migrations/` + API routes in `src/app/api/{game-name}/` + helpers in `src/server/db/{game-name}.ts` |

---

## Step 0 — Pick the Pattern

Three patterns exist in the repo. Pick one **before** writing any code. The pattern decides what files you need.

| Pattern | When to use | Reference game | Required files in `src/games/{game}/` |
|---|---|---|---|
| **A. Minimal offline** | Team-based, single-device, state can live in component `useState` | `pictionary`, `dumbcharades` | `types.ts`, `{Game}Game.tsx`, `index.ts`, `components/` |
| **B. Stateful offline** | Multi-phase pass-the-phone, state benefits from Zustand + pure engine | `mafia`, `wavelength` | `types.ts`, `engine.ts`, `store.ts`, `{Game}Game.tsx`, `index.ts`, `components/` |
| **C. Online (multi-device)** | Multiple devices over the network, persisted in Supabase | `wordspy`, `mindfield` | All of B, **plus** `HomeScreen.tsx`, `RoomGame.tsx`, `useRoom.ts`, optionally `OfflineGame.tsx`, `wordPacks.ts` |

If unsure, default to **B**.

---

## Step 1 — Write the Gameplay Doc

Create `docs/gameplay/{GAME_NAME}.md` before any code. The design doc is the implementation contract.

Use this exact structure. All sections required.

```
# {EMOJI} {Game Name} — Game Document

## Overview
1–2 paragraphs: what the game is, how many players, single-device vs multi-device,
offline only / online only / both.

## Objective
Table: who wins and how. Every win condition explicit.

## Roles / Teams
Per role/team:
  - Count (number per game or formula)
  - What they do
  - Win condition
  - Strategy tip

## Role / Team Assignment
How roles/teams are determined — formula or player-count table.

## Game Phases
Ordered list. One subsection per phase.

### `phase-name`
What happens. Who acts. What state fields change. Edge cases.
Phase names are lowercase kebab-case — they become GameState.phase string values.

## Tiebreaker / Special Flows (if any)
Any non-linear flows: ties, retries, conditional branches.

## Host Configuration Options
Table: option name | type | default | description

## Word Packs (if applicable)
Which packs are used and how (paired words, word lists, or per-game packs in Supabase).

## Implemented Screens / Components
Table: component name | phase | file path (relative to repo root)

## State Shape Reference
Complete TypeScript interfaces. No `any`. No placeholders.
  - GameState (all fields, all phases)
  - GameConfig (all options) + DEFAULT_CONFIG export
  - Player or Team
  - Sub-types (NightResult, EliminationRecord, etc.)

## Win Condition Logic
Precise enough to implement checkWinCondition() directly from this section.

## Online Mode (Pattern C only)
  - DB tables added or reused (rooms, room_players, {game}_state, etc.)
  - API routes (HTTP method + path + payload + response)
  - Realtime channel name and event types
  - Which writes are optimistic and which round-trip
```

Reference: [gameplay/MAFIA.md](gameplay/MAFIA.md) for B, [gameplay/MINDFIELD.md](gameplay/MINDFIELD.md) for C.

Do not proceed until this doc is complete.

---

## Step 2 — Scaffold the Folder

Create only the files required by your chosen pattern from Step 0. Do **not** copy an existing game's files wholesale — derive each file from your gameplay doc. Use existing games as **structural** references only.

Pattern A example tree:
```
src/games/{game}/
  types.ts
  {Game}Game.tsx
  index.ts
  components/
    ui.tsx
    RulesModal.tsx
    {Phase}Screen.tsx
```

Pattern B example tree (adds engine + store):
```
src/games/{game}/
  types.ts
  engine.ts
  store.ts
  {Game}Game.tsx
  index.ts
  components/
    ui.tsx
    RulesModal.tsx
    {Phase}Screen.tsx
```

Pattern C example tree (adds room shell + realtime hook):
```
src/games/{game}/
  types.ts
  engine.ts
  store.ts
  HomeScreen.tsx        ← entry: pick create-room vs join-room
  RoomGame.tsx          ← phase switcher for the multi-device room
  useRoom.ts            ← Supabase Realtime subscription + ETag polling
  index.ts              ← re-exports HomeScreen
  components/
    ui.tsx
    RulesModal.tsx
    {Phase}Screen.tsx
```

Cross-game shared screens (use these instead of duplicating):
- `src/games/shared/TeamSetupScreen.tsx` — name players & assign to teams
- `src/games/shared/TeamAssignScreen.tsx` — view the team split before the game starts
- `src/games/shared/WordReveal.tsx` — pass-phone word reveal

Source: [src/games/shared/index.ts](../src/games/shared/index.ts).

---

## Step 3 — Implement the Game

Order matters. Each file derives from your gameplay doc.

### `types.ts`
From the **State Shape Reference** section:
- Phase and role union types
- `Player` or `Team` interface
- Sub-types
- `GameConfig` interface
- `GameState` interface (must include a `phase` field of the phase union type)
- `DEFAULT_CONFIG` constant export

No `any`. No `unknown` unless you justify it.

### `engine.ts` (Patterns B and C)
Pure functions only. No React imports. No side effects. No mutation — every function returns new state.

From the **Game Phases** and **Win Condition Logic** sections:
- Entity constructor: `createPlayer(name)` or equivalent
- `assignRoles(players, config)` if applicable
- One function per phase transition (`startGame`, `nextRound`, `processVote`, …)
- `checkWinCondition(state)` → winner string | null

### `store.ts` (Patterns B and C)
Zustand. Pattern depends on offline vs online:

| Pattern | Store shape |
|---|---|
| B (offline) | `{ game: GameState, set(partial), reset() }` — see [src/games/mafia/store.ts](../src/games/mafia/store.ts) |
| C (online) | `{ localPlayer, gameState, setGameState(state), … }` — see [src/games/mindfield/store.ts](../src/games/mindfield/store.ts) |

Initial state matches `DEFAULT_CONFIG`.

### `{Game}Game.tsx` (B) or `RoomGame.tsx` (C)
Phase switcher. One conditional return per `GameState.phase` value. One screen import per phase.

### `components/{Phase}Screen.tsx`
One component per phase listed in the gameplay doc's **Implemented Screens** table.

Always include `components/RulesModal.tsx` with the full rules from the gameplay doc. Use the `RulesModal` shell from `@playhub/ui` (it owns the modal chrome — you only pass title + body).

Every screen layout:
- Outer `<Screen>` wrapper (from `@playhub/ui`)
- `<TopBar>` with game logo and rules trigger
- Content cards stacked vertically
- Primary action `<Btn variant="primary" fullWidth>` at the bottom

### `components/ui.tsx`
**This file is for game-specific atoms only** — the game logo and any small game-specific badges (e.g. `RoleBadge`, `RoundBar`, `SectionLabel`).

Do **not** redefine `Screen`, `TopBar`, `Btn`, `Card`, `NavBtn`, `Avatar`, `Modal`, `RulesModal`, `RevealCover`, `CategoryPicker`, `PlayerNameInput`, `Input`, `Badge`, `Toggle`, `ConfirmDialog`, `OptionsMenu`, `Divider`, `Spinner`, `LoadingScreen`, `EmptyState`, `ErrorBox`, `InfoBox`, `PhaseTrail`, `GameLobbyScreen`, `RevealProgressDots`, `useToast`, `ToastContainer`, `useGoHome`, `tokens`, animations (`fadeUp`, `fadeIn`, `stagger`) — **all come from `@playhub/ui`**. See full export list in [packages/ui/src/index.tsx](../packages/ui/src/index.tsx).

Reference for `components/ui.tsx` shape: [src/games/wordspy/components/ui.tsx](../src/games/wordspy/components/ui.tsx) (online) or [src/games/mafia/components/ui.tsx](../src/games/mafia/components/ui.tsx) (minimal).

### Styling rules
- Use `tokens` from `@playhub/ui` for all colors, spacing, radii. No hard-coded color values.
- Framer Motion: `AnimatePresence` + `fadeUp` on mount, `whileTap` scale 0.97.
- Mobile-first; test at 375px width.

---

## Step 3.5 — Online Mode (Pattern C only — skip otherwise)

### Database migration
Add `database/migrations/00N_{game}.sql` (next sequential number — current latest is `005_mindfield_indexes.sql`).

Required setup:
- If you reuse `word_packs`/`words`, your game slug must be allowed in `word_packs.game`. Migration `002_mindfield.sql` already dropped the hardcoded CHECK constraint, so any slug is accepted now.
- If your game needs game-specific state, add a `{game}_state` table or store JSON in `rooms.state`. Follow the precedent in [database/migrations/004_mindfield_normalize.sql](../database/migrations/004_mindfield_normalize.sql).
- Add indexes for any lookup pattern your API routes will hit.
- Update `database/rls.sql` with policies for any new tables.

### Server DB helpers
Add `src/server/db/{game}.ts`. Pattern: thin async functions that use the service-role client from `src/server/supabase.ts`. Reference: [src/server/db/mindfield.ts](../src/server/db/mindfield.ts).

### API routes
Use the **per-game namespace** convention (preferred): `src/app/api/{game}/rooms/...`. Mindfield's routes are the canonical example:

```
src/app/api/{game}/rooms/route.ts                  ← POST: create room, GET: list/lookup
src/app/api/{game}/rooms/[id]/state/route.ts       ← GET (with ETag) / PATCH state
src/app/api/{game}/rooms/[id]/start/route.ts       ← POST: transition lobby → playing
src/app/api/{game}/rooms/[id]/{action}/route.ts    ← per-game actions (reveal, vote, …)
```

(Wordspy uses the older shared `src/app/api/rooms/` namespace — do not follow that pattern for new games.)

Every route runs on the server: import from `@/server/db/...`, never expose the service-role key client-side.

### Realtime + state sync
Channel name convention: `{game}:${roomId}`.

Pattern (see [src/games/mindfield/useRoom.ts](../src/games/mindfield/useRoom.ts)):
1. Subscribe to Supabase Realtime broadcast on `{game}:${roomId}`.
2. On every broadcast event, refetch state with `If-None-Match` ETag header — server returns `304` if unchanged.
3. Treat the fetched snapshot as the source of truth; render from it.
4. **Optimistic writes**: wrap mutating API calls in a `push()` helper that updates local store immediately and rolls back on error.

### Environment variables
Required for any online game (already declared in [turbo.json](../turbo.json)):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only — used by `src/server/supabase.ts`)

### Room route
Add `src/app/{game}/room/[id]/page.tsx` so shareable join links work. Thin wrapper that renders `<RoomGame roomId={params.id} />`.

---

## Step 4 — Register in Home

Add an entry to the `GAMES` array in [packages/config/src/games.ts](../packages/config/src/games.ts):

```ts
{
  slug: "{game-name}",                // kebab-case; matches /src/app/{slug}/ and route
  name: "{Game Name}",                // display name shown on the home tile
  split: ["{First}", "{Rest}"],       // name split — second part renders in coral
  emoji: "{EMOJI}",
  description: "{One-line tagline.}",
  players: "{N}+",                    // e.g. "4–10" or "5+"
  themeColor: "#CC785C",              // hex; used by viewport themeColor
  tags: ["deduction"],                // REQUIRED — see allowed values below
  featured: false,                    // optional
  steps: [
    // 4–5 bullet steps describing how to play (shown in home modal)
  ],
},
```

Allowed `tags` values (extend only if no existing tag fits): `deduction`, `teams`, `acting`, `drawing`, `small`, `online`.

The home page reads from `GAMES` automatically.

Add the favicon at `src/public/favicons/favicon-{game-name}.svg`. Copy any existing one as a base. The file must exist before deploy or the layout's `icons.icon` reference 404s.

---

## Step 5 — Wire the Route

**`src/app/{game-name}/page.tsx`**
```tsx
import { {Game}Game } from "@/games/{game-name}";
export default function Page() { return <{Game}Game />; }
```

For Pattern C, `index.ts` exports `HomeScreen` and `page.tsx` renders `<HomeScreen />`.

**`src/app/{game-name}/layout.tsx`** — use Next.js Metadata API. Read game metadata from `GAME_BY_SLUG` so name, color, and description stay in sync with the registry:

```tsx
import type { Metadata, Viewport } from "next";
import { GAME_BY_SLUG } from "@playhub/config";

const game = GAME_BY_SLUG["{game-name}"];

export const metadata: Metadata = {
  title: `${game.name} – PlayHub`,
  description: game.description,
  icons: { icon: "/favicons/favicon-{game-name}.svg" },
};

export const viewport: Viewport = {
  themeColor: game.themeColor,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100dvh" }}>{children}</div>;
}
```

> **Known bug — do not copy verbatim:** existing layouts have `title: \` – PlayHub\`` with `${game.name}` missing. Use the corrected template above.

---

## Step 6 — Update Docs

- [ ] Add a game section in [docs/GAMEPLAY.md](GAMEPLAY.md) under "Games" matching the format of existing sections.
- [ ] Add a row to the **Documentation Index** table in [docs/GAMEPLAY.md](GAMEPLAY.md).
- [ ] Add a row to the **Per-App Summary** table in [docs/ARCHITECTURE.md](ARCHITECTURE.md).
- [ ] If online, list your API routes in the "Pattern C apps also have API routes" table in ARCHITECTURE.md.

---

## Step 7 — Verify

- [ ] `npm run dev` from repo root — boots without errors on `localhost:3000`.
- [ ] `npm run build` — TypeScript compiles, no `any`, no missing types.
- [ ] `npm run lint` — passes.
- [ ] New game route reachable at `localhost:3000/{game-name}`.
- [ ] Home screen shows the new tile with correct name, emoji, color, description.
- [ ] Play through the full game on a 375px mobile viewport.
- [ ] Trigger every win condition.
- [ ] Test minimum/maximum player count + edge cases (ties, skipped phases).
- [ ] Every screen has TopBar + working RulesModal.
- [ ] Online only: open the game in two browser tabs; verify state stays in sync via Realtime.

There is no test runner in this repo. Verification is `dev` + `build` + `lint` + manual playthrough.

---

## Final Checklist

- [ ] `docs/gameplay/{GAME_NAME}.md` complete, all sections filled
- [ ] All TypeScript types complete — no `any`, no placeholders
- [ ] `engine.ts` pure — no React, no side effects (if Pattern B/C)
- [ ] Every phase in the gameplay doc has a corresponding screen component
- [ ] `RulesModal.tsx` covers all rules from the gameplay doc
- [ ] Entry added to `packages/config/src/games.ts` with required `tags` field
- [ ] Favicon file exists at `src/public/favicons/favicon-{game-name}.svg`
- [ ] `layout.tsx` uses Metadata API with correctly interpolated `title`
- [ ] `docs/GAMEPLAY.md` and `docs/ARCHITECTURE.md` updated
- [ ] **Online only:** migration added, RLS policies updated, API routes under `/api/{game}/`, env vars confirmed, channel named `{game}:${roomId}`
- [ ] `dev`, `build`, `lint` all green; mobile playthrough done

---

## Reference — Existing Games

Calibration for expected depth.

| Game | Design Doc | Source | Pattern |
|---|---|---|---|
| Mafia | [gameplay/MAFIA.md](gameplay/MAFIA.md) | [src/games/mafia/](../src/games/mafia/) | B — start here for offline |
| Wavelength | [gameplay/WAVELENGTH.md](gameplay/WAVELENGTH.md) | [src/games/wavelength/](../src/games/wavelength/) | B — spectrum-based, two teams |
| Pictionary | [gameplay/PICTIONARY.md](gameplay/PICTIONARY.md) | [src/games/pictionary/](../src/games/pictionary/) | A — minimal, canvas-based |
| Dumb Charades | [gameplay/DUMBCHARADES.md](gameplay/DUMBCHARADES.md) | [src/games/dumbcharades/](../src/games/dumbcharades/) | A — minimal, no canvas |
| Wordspy | [gameplay/WORDSPY.md](gameplay/WORDSPY.md) | [src/games/wordspy/](../src/games/wordspy/) | C — legacy online (shared `/api/rooms`) |
| **Mind Field** | [gameplay/MINDFIELD.md](gameplay/MINDFIELD.md) | [src/games/mindfield/](../src/games/mindfield/) | **C — canonical online template (per-game `/api/{game}/rooms`)** |
