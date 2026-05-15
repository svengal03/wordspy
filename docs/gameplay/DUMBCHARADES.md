# 🎬 Dumb Charades — Game Document

## Overview

Dumb Charades is a **team-based silent acting and guessing game** for 4+ players (2–6 teams). The active actor picks a secret word (movie/show title or category item) from 3 difficulty-tiered options and acts it out silently — no sounds, no mouthing words. Teammates shout guesses. Points are scored based on difficulty. Highest score wins.

Structurally near-identical to Pictionary but the acting phase replaces the drawing canvas.

Offline pass-the-phone only. No online/multiplayer mode.

---

## Objective

Score the most points across all turns. Points are based on the difficulty of the word chosen. Host decides when to end the game (typically after equal turns per team).

---

## Teams

- 2–6 teams
- Each team has a name, a list of player names, and a score
- Teams take turns in order
- Within each team, the **actor** role rotates: `actorIdx` increments after each turn
- Team palettes from `@playhub/core`: `TEAM_PALETTE_DUMBCHARADES` (6 colors)

---

## Role / Team Assignment

Teams are created manually by the host during setup:
- Host adds 2–6 teams, giving each a name and adding player names
- No role assignment — all players on a team share the same role (actor rotates)
- Actor index (`actorIdx`) starts at 0 and increments after each turn
- Team order is fixed at setup and cycles: Team 1 → Team 2 → ... → Team N → Team 1

---

## Game Phases

```
setup → word-reveal → acting → round-result → (next turn or game-over)
```

### `setup`
- Host adds 2–6 teams, each with player names
- Set **timer duration**: 60s / 90s / 120s
- Select **word packs** (Bollywood, Tollywood, etc.) via multi-select grid
- Default packs: `bollywood`, `tollywood`
- Tap **Start** → word pool built from selected packs

### `word-reveal`
- Phone handed to the current team's actor (face-down)
- Actor taps to see their **3 word options** (Easy / Medium / Hard)
- Actor picks one → sets `currentWord` and `currentDifficulty`
- Actor hides screen and signals ready to their team

### `acting`
- Countdown timer starts
- Actor performs silently — no canvas, no drawing
- Screen shows: the timer, the word for the actor only (or hidden — implementation choice), a **Done** or pass button
- Teammates guess verbally
- Timer runs out → auto-advance to `round-result`
- If correct → host taps **✅ Correct** → advance immediately

### `round-result`
- Shows: the word, result (correct/timeout), points earned
- Score updated: team's score += difficulty points
- Leaderboard shown
- Host taps **Next Turn** → next team's `word-reveal`

### `game-over`
- Triggered when host taps **End Game**
- Final leaderboard with all scores
- Winner announced
- Play again option (resets to `setup`)

---

## Scoring

| Difficulty | Points | Color |
|---|---|---|
| Easy | low | `#2BB34A` (green) |
| Medium | standard | `#F59E0B` (amber) |
| Hard | high | `#E84040` (red) |

Point values defined in `@playhub/core` `DIFFICULTY_*` constants.

---

## Word Selection

Same mechanism as Pictionary:
- `wordPool` pre-built from all selected packs at game start
- 3 options drawn per turn: one per difficulty tier
- Words consumed without replacement during a session

---

## Acting Rules (enforced socially)
- Actor **cannot make any sounds** — no humming, no mouthing
- No props — body and hands only
- Standard Dumb Charades signals are allowed:
  - Number of words (hold up fingers)
  - Which word you're acting (tap fingers on arm)
  - Syllable count (chop forearm)
  - "Sounds like" (cup hand to ear)
  - "Whole thing" (spread arms wide)
  - Small/big word (show with fingers)

---

## Host Configuration Options

| Option | Type | Default | Description |
|---|---|---|---|
| `timerDuration` | number | `60` | Seconds per acting turn (60/90/120) |
| `selectedPackIds` | string[] | `["bollywood","tollywood"]` | Active word packs |
| Team count | 2–6 | 2 | Number of competing teams |

---

## Implemented Screens / Components

| Component | Phase | File |
|---|---|---|
| `SetupScreen` | setup | `components/SetupScreen.tsx` |
| `WordReveal` | word-reveal | `components/WordReveal.tsx` |
| `ActingScreen` | acting | `components/ActingScreen.tsx` |
| `RoundResult` | round-result | `components/RoundResult.tsx` |
| `GameOver` | game-over | `components/GameOver.tsx` |
| `CategoryPicker` | setup | `components/CategoryPicker.tsx` |
| `RulesModal` | any | `components/RulesModal.tsx` |

---

## State Shape Reference

There is no separate `GameConfig` type — configuration options (`timerDuration`, `selectedPackIds`) are stored directly in `GameState`. Default values are set when the game starts.

```ts
// lib/types.ts
import type { Difficulty } from "@playhub/core"

type Phase = "setup" | "word-reveal" | "acting" | "round-result" | "game-over"

interface Team {
  name: string
  score: number
  players: string[]
  actorIdx: number   // index into players[] for current actor, increments each turn
}

interface GameState {
  phase: Phase
  teams: Team[]
  currentTeamIdx: number
  timerDuration: number          // seconds per turn — default: 60
  selectedPackIds: string[]      // active word packs — default: ["bollywood", "tollywood"]
  currentWord: string
  wordOptions: [string, string, string]   // Easy, Medium, Hard options shown to actor
  wordPool: string[]                      // remaining words for this session (consumed without replacement)
  lastRoundCorrect: boolean | null
  roundNumber: number
  currentDifficulty: Difficulty
  lastDifficulty: Difficulty | null
}
```

---

## Win Condition Logic

There is no fixed end condition. The host ends the game manually from the `round-result` screen.

```
winner = team with highest score at the time host taps "End Game"
if tie → team that appears first in teams[] (i.e. created first in setup) wins
```

Points per turn:
```
correct = true  → score += points for currentDifficulty
correct = false → score += 0
```

Point values are constants from `@playhub/core` (`DIFFICULTY_*`).

---

## Difference vs Pictionary

| Aspect | Pictionary | Dumb Charades |
|---|---|---|
| Active phase | `drawing` | `acting` |
| Active component | `DrawingCanvas.tsx` | `ActingScreen.tsx` |
| Phase key | `"drawing"` | `"acting"` |
| Actor role field | `drawerIdx` | `actorIdx` |
| Default packs | bollywood, tollywood, south-food, north-food | bollywood, tollywood |
| Team palette | `TEAM_PALETTE_PICTIONARY` | `TEAM_PALETTE_DUMBCHARADES` |

All other logic (`SetupScreen`, `WordReveal`, `RoundResult`, `GameOver`, scoring, word pool) is identical or near-identical — a known duplication identified in `AUDIT.md` (F6).
