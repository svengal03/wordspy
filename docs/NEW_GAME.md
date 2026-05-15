# Adding a New Game to PlayHub

This document is the end-to-end instruction for adding a new game. Read it fully before acting. All structural standards are owned by `docs/ARCHITECTURE.md`. All per-game design format is defined by the existing gameplay docs in `docs/gameplay/`.

---

## What You Are Doing

You are adding a standalone Next.js game app to the PlayHub Turborepo monorepo. The output is:

| Artifact | Location |
|---|---|
| Game design doc | `docs/gameplay/{GAME_NAME}.md` |
| App source | `apps/{game-name}/` |
| Home registration | `apps/home/app/page.tsx` + `apps/home/.env.local` |
| Docs updates | `docs/GAMEPLAY.md` + `docs/ARCHITECTURE.md` |

---

## Before You Start

Read these docs in order. Do not write any files until all three are read.

| Step | Read | Why |
|---|---|---|
| 1 | `docs/ARCHITECTURE.md` | Source of truth for app file structure, shared packages, and UI conventions |
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

## Step 2 — Scaffold the App

Copy the Mafia app as the base — it is the simplest offline pass-phone game.

```
cp -r apps/mafia apps/{game-name}
```

Update `package.json`:
- Set `name` to the game slug
- Set the dev port (`next dev --port {PORT}`) — pick the next available port after existing apps

Update `next.config.js`:
- Set the app name
- Add any required environment variables

---

## Step 3 — Implement the App

Work through files in this order. Each file must be derived directly from the gameplay doc written in Step 1.

### `lib/types.ts`

Wipe the Mafia types. Implement from scratch using the gameplay doc's **State Shape Reference** section:
- All phase and role union types
- `Player` or `Team` interface
- All sub-types (`NightResult`, `EliminationRecord`, etc.)
- `GameConfig` interface with all host options
- `GameState` interface with all fields
- `DEFAULT_CONFIG` export

### `lib/gameEngine.ts`

Pure functions only. No React imports. No side effects. No mutation — every function takes state in and returns new state out.

Derive functions from the gameplay doc's **Game Phases** and **Win Condition Logic** sections:
- `createPlayer(name)` or equivalent entity constructor
- `assignRoles(players, config)` if the game has role assignment
- One function per phase transition (`startGame`, `nextRound`, `processVote`, etc.)
- `checkWinCondition(state)` — returns winner string or null

### `lib/store.ts`

Zustand store following the Mafia pattern:
- State shape: `{ game: GameState, set: (partial) => void, reset: () => void }`
- Initial state matches DEFAULT_CONFIG values

### `app/page.tsx`

Phase switcher. One conditional return per phase value from `GameState.phase`. Import one screen component per phase.

### `components/game/*.tsx`

One component per phase as listed in the gameplay doc's **Implemented Screens** section. Always include `RulesModal.tsx` with the full rules content from the gameplay doc.

Every screen follows this layout (from `docs/ARCHITECTURE.md`):
- Outer `<Screen>` wrapper
- `<TopBar>` with `PlayHubLogo` and `RulesModal` trigger
- Content cards stacked vertically
- Primary action `<Btn variant="primary" fullWidth>` at the bottom

UI rules — all from `docs/ARCHITECTURE.md`:
- Use tokens from local `components/ui/index.tsx` — no custom color values
- Use `RevealCover` from `@playhub/ui` for any pass-the-phone reveal step
- Use `CategoryPicker` from `@playhub/ui` for word pack selection
- Use `PlayerNameInput` from `@playhub/ui` for player name entry
- Framer Motion: `AnimatePresence` + fade-up on mount, `whileTap` scale 0.97

### `components/ui/index.tsx`

Copy from `apps/mafia/components/ui/index.tsx`. Update only the app name string inside `PlayHubLogo`.

---

## Step 4 — Register in Home

**`apps/home/app/page.tsx`** — add an entry to the `games` array:

```
{
  name: "{GameName}",
  split: ["{First}", "{Second}"],   // split for coral highlight on second part
  emoji: "{EMOJI}",
  description: "{One-line description.}",
  href: process.env.NEXT_PUBLIC_{GAMENAME}_URL,
  players: "{N}+",
}
```

**`apps/home/.env.local`** — add the URL environment variable:

```
NEXT_PUBLIC_{GAMENAME}_URL=http://localhost:{PORT}
```

---

## Step 5 — Update Docs

- [ ] Add a game section to `docs/GAMEPLAY.md` under Games (match the format of existing sections)
- [ ] Add a row to the Documentation Index table in `docs/GAMEPLAY.md`
- [ ] Add a row to the Per-App Summary table in `docs/ARCHITECTURE.md`

---

## Step 6 — Verify

- [ ] `npm run dev` from repo root — all apps start without errors
- [ ] Play through the full game at least once on a 375px mobile viewport
- [ ] Test win conditions: trigger every possible winner
- [ ] Test minimum player count and edge cases (tie votes, skipped phases)
- [ ] Confirm every screen has a TopBar with PlayHubLogo and a working RulesModal

---

## Checklist — Before Calling It Done

- [ ] `docs/gameplay/{GAME_NAME}.md` exists with all sections complete
- [ ] All TypeScript types are complete — no `any`, no placeholders
- [ ] `gameEngine.ts` contains only pure functions — no React, no side effects
- [ ] Every phase in the gameplay doc has a corresponding screen component
- [ ] `RulesModal.tsx` covers all rules from the gameplay doc
- [ ] Game registered in home app (`page.tsx` + `.env.local`)
- [ ] `docs/GAMEPLAY.md` and `docs/ARCHITECTURE.md` updated
- [ ] Full playthrough verified on mobile width

---

## Reference — Existing Games

Use these as calibration for expected depth and implementation quality.

| Game | Design Doc | App | Pattern |
|---|---|---|---|
| Mafia | `docs/gameplay/MAFIA.md` | `apps/mafia/` | Simplest offline — start here |
| Pictionary | `docs/gameplay/PICTIONARY.md` | `apps/pictionary/` | Team-based with canvas |
| Dumb Charades | `docs/gameplay/DUMBCHARADES.md` | `apps/dumbcharades/` | Team-based, no canvas |
| Wordspy | `docs/gameplay/WORDSPY.md` | `apps/wordspy/` | Online + offline, Pusher |
