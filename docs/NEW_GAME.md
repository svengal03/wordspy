# Adding a New Game to PlayHub

This document is the end-to-end instruction for adding a new game. Read it fully before acting. All structural standards are owned by `docs/ARCHITECTURE.md`. All per-game design format is defined by the existing gameplay docs in `docs/gameplay/`.

---

## What You Are Doing

You are adding a new game **inside the single Next.js app** (`src/`). The output is:

| Artifact | Location |
|---|---|
| Game design doc | `docs/gameplay/{GAME_NAME}.md` |
| Game logic + UI | `src/games/{game-name}/` |
| Next.js route | `src/app/{game-name}/page.tsx` + `layout.tsx` |
| Game registry | `packages/config/src/games.ts` |
| Docs updates | `docs/GAMEPLAY.md` + `docs/ARCHITECTURE.md` |

---

## Before You Start

Read these docs in order. Do not write any files until all three are read.

| Step | Read | Why |
|---|---|---|
| 1 | `docs/ARCHITECTURE.md` | Source of truth for file structure, shared packages, and UI conventions |
| 2 | `docs/gameplay/MAFIA.md` | Canonical example of a simple offline game design doc |
| 3 | `docs/gameplay/WORDSPY.md` | Example of a more complex game with online mode |

---

## Step 1 — Write the Gameplay Doc

Create `docs/gameplay/{GAME_NAME}.md` before any code is written. The design doc is the contract the implementation must follow. If the design is incomplete, the implementation will be wrong.

Use this exact structure. All sections are required — do not skip or abbreviate any section.

```
# {EMOJI} {Game Name} — Game Document

## Overview
1–2 paragraphs: what the game is, how many players, pass-the-phone or multi-device,
offline only or online + offline.

## Objective
Table: who wins and how. Every win condition listed explicitly.

## Roles / Teams
For each role or team:
  - Count (number present per game or formula)
  - What they do
  - Their win condition
  - Strategy tip

## Role / Team Assignment
How roles or teams are determined — formula or player-count table.

## Game Phases
Ordered list. One subsection per phase.

### `phase-name`
What happens in this phase. Who acts. What state fields change. Edge cases and sub-steps.
Phase names are lowercase kebab-case — they become the GameState.phase string values.

## Tiebreaker / Special Flows (if any)
Any non-linear flows: ties, retries, conditional branches.

## Host Configuration Options
Table: option name | type | default | description
Every option the host can configure before the game starts.

## Word Packs (if applicable)
Which packs are used and how — paired words or word lists.
Reference pack IDs from @playhub/core: bollywood, tollywood, south-food, north-food.

## Implemented Screens / Components
Table: component name | phase | file path
One row per screen component. File paths relative to the app root.

## State Shape Reference
Complete TypeScript interfaces:
  - GameState (all fields, all phases)
  - GameConfig (all config options + DEFAULT_CONFIG export)
  - Player or Team (all fields)
  - Any sub-types (NightResult, EliminationRecord, etc.)
No placeholders. No `any`. Every field typed.

## Win Condition Logic
Exact logic in pseudocode or plain English. Must be precise enough to implement
checkWinCondition() directly from this section.
```

Do not proceed to Step 2 until the gameplay doc is complete and reviewed.

---

## Step 2 — Scaffold the Game Module

Do not copy any existing game. Create all files from scratch following the structure below. Use the existing games as reading references only — derive every file's content from the gameplay doc written in Step 1.

**Canonical folder structure** (every offline game uses this layout):

```
src/games/{game-name}/
  types.ts
  engine.ts
  store.ts
  {Game}Game.tsx
  index.ts
  components/
    ui.tsx
    RulesModal.tsx
    {Phase}Screen.tsx   ← one per phase from your gameplay doc
```

Games with a team setup phase also use `src/games/shared/` components — read `src/games/shared/index.ts` to see what's available before writing duplicates.

Create the Next.js route:

**`src/app/{game-name}/page.tsx`**
```tsx
import { {Game}Game } from "@/games/{game-name}";
export default function Page() { return <{Game}Game />; }
```

**`src/app/{game-name}/layout.tsx`** — model on any existing `src/app/*/layout.tsx`, update the `<title>` and `<link rel="icon">` href to point to `favicons/favicon-{game-name}.svg`.

---

## Step 3 — Implement the Game

Work through files in this order. Each file must be derived directly from the gameplay doc written in Step 1.

### `src/games/{game}/types.ts`

Wipe the Mafia types. Implement from scratch using the gameplay doc's **State Shape Reference** section:
- All phase and role union types
- `Player` or `Team` interface
- All sub-types (`NightResult`, `EliminationRecord`, etc.)
- `GameConfig` interface with all host options
- `GameState` interface with all fields
- `DEFAULT_CONFIG` export

### `src/games/{game}/engine.ts`

Pure functions only. No React imports. No side effects. No mutation — every function takes state in and returns new state out.

Derive functions from the gameplay doc's **Game Phases** and **Win Condition Logic** sections:
- `createPlayer(name)` or equivalent entity constructor
- `assignRoles(players, config)` if the game has role assignment
- One function per phase transition (`startGame`, `nextRound`, `processVote`, etc.)
- `checkWinCondition(state)` — returns winner string or null

### `src/games/{game}/store.ts`

Zustand store. Read `src/games/wavelength/store.ts` or `src/games/mafia/store.ts` for the pattern:
- State shape: `{ game: GameState, set: (partial) => void, reset: () => void }`
- Initial state matches DEFAULT_CONFIG values

### `src/games/{game}/{Game}Game.tsx`

Phase switcher. One conditional return per phase value from `GameState.phase`. Import one screen component per phase.

### `src/games/{game}/components/*.tsx`

One component per phase as listed in the gameplay doc's **Implemented Screens** section. Always include `RulesModal.tsx` with the full rules content from the gameplay doc.

Every screen follows this layout (from `docs/ARCHITECTURE.md`):
- Outer `<Screen>` wrapper
- `<TopBar>` with game logo and `RulesModal` trigger
- Content cards stacked vertically
- Primary action `<Btn variant="primary" fullWidth>` at the bottom

UI rules — all from `docs/ARCHITECTURE.md`:
- Use tokens from local `components/ui.tsx` — no custom color values
- Use `RevealCover` from `@playhub/ui` for any pass-the-phone reveal step
- Use `CategoryPicker` from `@playhub/ui` for word pack selection
- Use `PlayerNameInput` from `@playhub/ui` for player name entry
- Framer Motion: `AnimatePresence` + fade-up on mount, `whileTap` scale 0.97

### `src/games/{game}/components/ui.tsx`

Read `src/games/mafia/components/ui.tsx` or `src/games/wavelength/components/ui.tsx` to understand the pattern (Screen, TopBar, Btn, Card exports). Create this file from scratch — update only the game name string inside the logo component.

---

## Step 4 — Register in Home

**`packages/config/src/games.ts`** — add an entry to the `GAMES` array:

```ts
{
  slug: "{game-name}",
  name: "{GameName}",
  split: ["{First}", "{Second}"],   // split for coral highlight on second part
  emoji: "{EMOJI}",
  description: "{One-line description.}",
  players: "{N}+",
  themeColor: "#CC785C",            // use a unique color if desired
  steps: [
    // 4–5 bullet steps describing how to play (shown in the home modal)
  ],
},
```

The home page (`src/app/page.tsx`) reads from `GAMES` automatically — no other home file changes needed.

Add a favicon at `src/public/favicons/favicon-{game-name}.svg` (copy any existing one as a base).

---

## Step 5 — Update Docs

- [ ] Add a game section to `docs/GAMEPLAY.md` under Games (match the format of existing sections)
- [ ] Add a row to the Documentation Index table in `docs/GAMEPLAY.md`
- [ ] Add a row to the Per-Game Summary table in `docs/ARCHITECTURE.md`

---

## Step 6 — Verify

- [ ] `npm run dev` from repo root — app starts without errors on `localhost:3000`
- [ ] New game route is reachable at `localhost:3000/{game-name}`
- [ ] Game appears on the home screen with correct name, emoji, and description
- [ ] Play through the full game at least once on a 375px mobile viewport
- [ ] Test win conditions: trigger every possible winner
- [ ] Test minimum player count and edge cases (tie votes, skipped phases)
- [ ] Confirm every screen has a TopBar with game logo and a working RulesModal

---

## Checklist — Before Calling It Done

- [ ] `docs/gameplay/{GAME_NAME}.md` exists with all sections complete
- [ ] All TypeScript types are complete — no `any`, no placeholders
- [ ] `engine.ts` contains only pure functions — no React, no side effects
- [ ] Every phase in the gameplay doc has a corresponding screen component
- [ ] `RulesModal.tsx` covers all rules from the gameplay doc
- [ ] Entry added to `packages/config/src/games.ts`
- [ ] Favicon added to `src/public/favicons/`
- [ ] `docs/GAMEPLAY.md` and `docs/ARCHITECTURE.md` updated
- [ ] Full playthrough verified on mobile width

---

## Reference — Existing Games

Use these as calibration for expected depth and implementation quality.

| Game | Design Doc | Source | Pattern |
|---|---|---|---|
| Mafia | `docs/gameplay/MAFIA.md` | `src/games/mafia/` | Simplest offline — start here |
| Pictionary | `docs/gameplay/PICTIONARY.md` | `src/games/pictionary/` | Team-based with canvas |
| Dumb Charades | `docs/gameplay/DUMBCHARADES.md` | `src/games/dumbcharades/` | Team-based, no canvas |
| Wavelength | `docs/gameplay/WAVELENGTH.md` | `src/games/wavelength/` | Spectrum-based, offline |
| Wordspy | `docs/gameplay/WORDSPY.md` | `src/games/wordspy/` | Online + offline, Supabase |
