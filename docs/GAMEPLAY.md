# PlayHub — Gameplay

`GAMEPLAY.md` is the canonical index for all game designs in PlayHub. It defines what games exist, where their full design docs live, and the reading order for understanding or extending the platform.

Standards for app structure and file layout are owned by `docs/ARCHITECTURE.md`. Per-game design docs own the rules, phases, types, and config for each game.

---

## Reading Order

| Step | Read | Why |
|---|---|---|
| 1 | [ARCHITECTURE.md](ARCHITECTURE.md) | Understand the monorepo structure, app patterns, shared packages, and UI conventions |
| 2 | This file | Know what games exist and where their design docs live |
| 3 | [gameplay/MAFIA.md](gameplay/MAFIA.md) | Canonical reference for a simple offline pass-phone game |
| 4 | [gameplay/WORDSPY.md](gameplay/WORDSPY.md) | Reference for the more complex online + offline game |
| 5 | [NEW_GAME.md](NEW_GAME.md) | Follow when adding a new game to the platform |

---

## Games

### Wordspy — [Full design doc](gameplay/WORDSPY.md)

Social deduction word game for **3–10 players**. Players receive secret roles and a word. Through one-word clues and open debate, Civilians try to find and eliminate the infiltrators before being outnumbered.

| | |
|---|---|
| **Roles** | Civilian · Undercover · Ghost |
| **Win** | Civilians eliminate all threats · Undercover outlasts civilians · Ghost survives or guesses the word |
| **Phases** | Lobby → Role Reveal → Clue → Discussion → Vote → Elimination → Summary |
| **Mode** | Online (multi-device via Supabase Realtime) + Offline (pass-the-phone) |
| **Players** | 3–10 |

---

### Mafia — [Full design doc](gameplay/MAFIA.md)

Social deduction role-play for **5–15 players**. A hidden Mafia faction eliminates someone each night. Each day, the group debates and votes to expose them. One player is God (host/narrator) and is never eliminated.

| | |
|---|---|
| **Roles** | Mafia · Villager · Doctor (optional) · Police (optional) · God |
| **Win** | Villagers eliminate all Mafia · Mafia reaches parity with non-Mafia living players |
| **Phases** | Setup → Role Reveal → Night → Day → Vote → Game Over |
| **Mode** | Offline only |
| **Players** | 5–15 |

---

### Pictionary — [Full design doc](gameplay/PICTIONARY.md)

Team-based drawing and guessing for **4+ players** (2–6 teams). The active drawer picks a secret word from 3 difficulty options and draws it on the phone screen. Teammates guess verbally. Points awarded by difficulty.

| | |
|---|---|
| **Teams** | 2–6, rotating drawer within each team |
| **Win** | Most points when host ends the game |
| **Phases** | Setup → Word Reveal → Drawing → Round Result → Game Over |
| **Mode** | Offline only |
| **Players** | 4+ |

---

### Dumb Charades — [Full design doc](gameplay/DUMBCHARADES.md)

Team-based silent acting and guessing for **4+ players** (2–6 teams). Identical structure to Pictionary — the active player acts silently instead of drawing. No sounds, no mouthing words.

| | |
|---|---|
| **Teams** | 2–6, rotating actor within each team |
| **Win** | Most points when host ends the game |
| **Phases** | Setup → Word Reveal → Acting → Round Result → Game Over |
| **Mode** | Offline only |
| **Players** | 4+ |

---

### Wavelength _(in progress)_

Spectrum-based team game. One player gives a clue to guide their team to a hidden target on a spectrum dial. Opposing teams score by guessing which side of the target is correct.

| | |
|---|---|
| **Teams** | 2 |
| **Win** | First team to reach the target score |
| **Phases** | Setup → Clue → Guess → Score → Game Over |
| **Mode** | Offline only |
| **Players** | 4+ |

---

## Common Mechanics

### Pass-the-Phone

All games are designed for same-room play on a single shared phone. No installs for other players — phone is passed face-down for private reveals.

### Word Packs

Shared word content from `@playhub/core`. All packs are available across games.

| Pack ID | Contents |
|---|---|
| `bollywood` | Hindi cinema 2000–2025 |
| `tollywood` | Telugu and Tamil cinema 2000–2025 |
| `south-food` | South Indian dishes and snacks |
| `north-food` | North Indian dishes and snacks |

Wordspy uses paired word packs (`{ civilian, undercover }` per entry). Pictionary and Dumb Charades use word lists with difficulty tiers.

### Difficulty Scoring

Used by Pictionary and Dumb Charades. Three tiers per turn — actor/drawer picks one.

| Tier | Color | Points |
|---|---|---|
| Easy | Green | Low |
| Medium | Amber | Standard |
| Hard | Red | High |

Point values are defined as constants in `@playhub/core`.

---

## Documentation Index

| Doc | Purpose | Owned By |
|---|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | App structure, file layout, shared packages, UI conventions | Source of truth |
| [GAMEPLAY.md](GAMEPLAY.md) | Games index, reading order, shared mechanics | This file |
| [gameplay/WORDSPY.md](gameplay/WORDSPY.md) | Wordspy rules, phases, config, state types | Wordspy |
| [gameplay/MAFIA.md](gameplay/MAFIA.md) | Mafia rules, phases, config, state types | Mafia |
| [gameplay/PICTIONARY.md](gameplay/PICTIONARY.md) | Pictionary rules, phases, config, state types | Pictionary |
| [gameplay/DUMBCHARADES.md](gameplay/DUMBCHARADES.md) | Dumb Charades rules, phases, config, state types | Dumb Charades |
| [NEW_GAME.md](NEW_GAME.md) | End-to-end instruction for adding a new game | New game process |

---

## Adding a New Game

See [NEW_GAME.md](NEW_GAME.md) for the complete step-by-step instruction.

When a new game is added:
1. Create `docs/gameplay/{GAME_NAME}.md` following the template in NEW_GAME.md
2. Add an entry to `packages/config/src/games.ts` — this registers the game on the home screen
3. Add `src/app/{game}/page.tsx` + `layout.tsx`
4. Implement `src/games/{game}/` — types → engine → store → `{Game}Game.tsx` → components
5. Add a section to this file under Games
6. Add a row to the Documentation Index table above
