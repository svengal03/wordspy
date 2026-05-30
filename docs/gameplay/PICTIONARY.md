# 🎨 Pictionary — Game Document

## Overview

Pictionary is a **team-based drawing and guessing game** for 4+ players (2–6 teams). The active drawer picks a secret word from 3 difficulty-tiered options and draws it on the phone screen — no speaking, no writing. Teammates shout guesses. Points are scored based on difficulty. The team with the most points wins.

Offline pass-the-phone only. No online/multiplayer mode.

---

## Objective

Score the most points across all turns. Points are awarded per difficulty tier of the word chosen. There is no fixed end condition — the host decides when to end the game (typically after equal turns per team).

---

## Teams

- 2–6 teams
- Each team has a name, a list of player names, and a score
- Teams take turns in order: Team 1 → Team 2 → ... → Team N → back to Team 1
- Within each team, the **drawer** role rotates: `drawerIdx` increments after each turn
- Team palettes from `@playhub/core`: `TEAM_PALETTE_PICTIONARY` (6 colors)

---

## Role / Team Assignment

Teams are created manually by the host during setup:
- Host adds 2–6 teams, giving each a name and adding player names
- No role assignment — all players on a team share the same role (drawer rotates)
- Drawer index (`drawerIdx`) starts at 0 and increments after each turn
- Team order is fixed at setup and cycles: Team 1 → Team 2 → ... → Team N → Team 1

---

## Game Phases

```
setup → word-reveal → drawing → round-result → (next turn or game-over)
```

### `setup`
- Host adds 2–6 teams, each with player names
- Set **timer duration**: 60s / 90s / 120s (from `TIMER_OPTIONS` in `@playhub/core`)
- Select **word packs** (multi-select grid via `CategoryPicker`)
- Default packs: `bollywood`, `tollywood`, `south-food`, `north-food`
- Tap **Start** → word pool is built from all selected packs

### `word-reveal`
- Phone handed to the current team's drawer (face-down)
- Drawer taps to reveal their **3 word options** (Easy / Medium / Hard)
- Drawer picks one → the chosen word becomes `currentWord`
- `currentDifficulty` is set based on which option was picked
- Drawer hides the screen and signals ready

### `drawing`
- Countdown timer starts (set during setup)
- Drawer draws on the full-screen canvas — finger/stylus only
- Canvas features: draw freely, **undo last stroke**, **clear all**
- Teammates guess verbally — no app input needed for guessing
- Timer runs out → auto-advance to `round-result`
- If teammates guess correctly → host taps **✅ Correct** → advance immediately

### `round-result`
- Shows: the word, whether correct or not, points earned (or 0)
- Score updated: team's score += points for `currentDifficulty`
- Shows updated leaderboard
- Host taps **Next Turn** → advances to next team's `word-reveal`

### `game-over`
- Triggered when host taps **End Game** from the round-result screen
- Shows final leaderboard with all team scores
- Winner announced (team with highest score)
- Option to play again (resets to `setup`)

---

## Scoring

Points come from `@playhub/core` `DIFFICULTY_*` constants:

| Difficulty | Points | Color |
|---|---|---|
| Easy | low | `#2BB34A` (green) |
| Medium | standard | `#F59E0B` (amber) |
| Hard | high | `#E84040` (red) |

The exact point values are defined in `DIFFICULTY_LABEL` / `DIFFICULTY_COLOR` in `packages/core/src/gameConstants.ts`.

---

## Word Selection

On each turn, 3 word options are drawn from `wordPool` at different difficulties:
- Words from the pool are selected without replacement during a session
- `wordPool` is pre-built at game start from all selected packs
- `wordOptions: [string, string, string]` — always one Easy, one Medium, one Hard

Words come from `@playhub/core` `WORD_PACKS` (Bollywood, Tollywood, South Food, North Food).

---

## Drawing Rules (enforced socially)
- Drawer **cannot speak or make sounds**
- Drawer **cannot write letters or numbers**
- No miming — only drawing on the canvas
- Teammates can shout guesses freely at any time

---

## Host Configuration Options

| Option | Type | Default | Description |
|---|---|---|---|
| `timerDuration` | number | `60` | Seconds per drawing turn (60/90/120) |
| `selectedPackIds` | string[] | `["bollywood","tollywood","south-food","north-food"]` | Active word packs |
| Team count | 2–6 | 2 | Number of competing teams |

---

## Implemented Screens / Components

| Component | Phase | File |
|---|---|---|
| `SetupScreen` | setup | `components/SetupScreen.tsx` |
| `WordReveal` | word-reveal | `components/WordReveal.tsx` |
| `DrawingCanvas` | drawing | `components/DrawingCanvas.tsx` |
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

type Phase = "setup" | "word-reveal" | "drawing" | "round-result" | "game-over"

interface Team {
  name: string
  score: number
  players: string[]
  drawerIdx: number   // index into players[] for current drawer, increments each turn
}

interface GameState {
  phase: Phase
  teams: Team[]
  currentTeamIdx: number
  timerDuration: number          // seconds per turn — default: 60
  selectedPackIds: string[]      // active word packs — default: [] (user selects at setup)
  currentWord: string
  wordOptions: [string, string, string]   // Easy, Medium, Hard options shown to drawer
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
correct = true  → score += calcScore(timeLeft, timerDuration, difficulty)
correct = false → score += 0
```

`calcScore` awards more points for higher difficulty and faster correct guesses (time bonus).

---

## Canvas Implementation Notes

`DrawingCanvas.tsx` uses an HTML `<canvas>` element:
- Touch events (`touchstart`, `touchmove`, `touchend`) for mobile drawing
- Mouse events for desktop
- Stroke history stored locally for undo functionality
- Clear and undo buttons overlay the canvas
- Canvas is full-screen height minus the timer bar
