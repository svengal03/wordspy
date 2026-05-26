# 🧠 Mind Field — Game Document

## Overview

Mind Field is a **two-team word deduction game** for 4–16 players. 25 words are displayed on a 5×5 grid visible to every player. Each team has one **Spymaster** — they see the full colour-coded grid on their own device and know which words belong to which team. Everyone else is a **Field Agent** who sees only plain words and must guess which ones belong to their team.

The Spymaster gives a one-word clue plus a number each turn. Field Agents tap words they think match. Words flip to reveal their colour. The first team to find all their words wins the round. One word is the Bomb — tap it and your team instantly loses the round. First team to win the target number of rounds wins the game.

Supports **online multiplayer only** — each player joins on their own device via a room code. The Spymaster must be on a separate device because they see information the agents cannot.

---

## Objective

| Team | Win Round By | Win Game By |
|---|---|---|
| 🔴 Red | Reveal all 9 of their words first — or Blue triggers the Bomb | Reach `targetWins` round wins first |
| 🔵 Blue | Reveal all 8 of their words first — or Red triggers the Bomb | Reach `targetWins` round wins first |

Red has 9 words; Blue has 8. Red goes first to compensate.

---

## Roles / Teams

### 🔴🔵 Teams
- Two teams: Red and Blue
- Each team has exactly **1 Spymaster** and 1 or more **Field Agents**
- Minimum team size: 2 players (1 Spymaster + 1 Agent)
- Minimum total: 4 players

### 🗝️ Spymaster (1 per team)
- **Sees:** the full colour-coded 5×5 grid (all tile colours always visible)
- **Does:** on their team's turn, types one clue word + a number (e.g. "River, 3")
- **Cannot:** gesture, react expressively, use part of a word on the grid as their clue, or give any hint beyond the clue
- **Win condition:** their team finds all their words before the other team does
- **Strategy:** give clues that link multiple words without accidentally pointing at the Bomb

### 👥 Field Agent (all other players)
- **Sees:** 5×5 grid with plain words; revealed tiles show their colour
- **Does:** discusses and taps words they believe match the Spymaster's clue
- **Cannot:** see tile colours until a word is tapped and revealed
- **Win condition:** same as their team
- **Strategy:** listen carefully to the clue, discuss with teammates, never tap without agreement

---

## Role / Team Assignment

Host assigns teams and roles manually in the lobby before starting:

1. Host assigns each player a team (Red or Blue) — drag-and-assign or tap-to-assign UI
2. Host designates exactly one player on each team as Spymaster
3. Game cannot start until both teams have at least 2 players and exactly 1 Spymaster each
4. Roles persist across rounds within the same game session

---

## Tile Distribution

| Colour | Count | Meaning |
|---|---|---|
| 🔴 Red | 9 | Red team's words |
| 🔵 Blue | 8 | Blue team's words |
| ⬜ Neutral | 7 | Ends the active team's turn |
| 💣 Bomb | 1 | Instant round loss for the team that taps it |
| **Total** | **25** | |

---

## Game Phases

```
lobby → playing → round-over → (playing again or game-over)
```

During `playing`, `turnPhase` tracks the sub-state: `giving-clue` → `guessing`.

### `lobby`

- Host creates a room → shares the 6-character room code
- Players join on their own devices by entering the code
- Host assigns players to Red and Blue teams
- Host designates exactly one Spymaster per team
- Host selects a word pack
- Host taps **Start Game** → `assignTiles()` runs, phase transitions to `playing`, `currentTeam = "red"`, `turnPhase = "giving-clue"`

### `playing`

The main game loop. Two sub-states:

#### `turnPhase: "giving-clue"`
- The active team's Spymaster device shows the clue input
- All other devices show a "Waiting for Spymaster…" message
- Spymaster types a clue word (single word, no spaces) and a number (1–9)
- Clue word must not be a word currently on the grid (validated client-side)
- On submit → `clue` and `clueNumber` stored, `guessesRemaining = clueNumber + 1`, `turnPhase = "guessing"`
- If `clueNumber >= 3` → set `bigClueUsedRed` or `bigClueUsedBlue` = true

#### `turnPhase: "guessing"`
- Active team's Field Agents see the grid and can tap any unrevealed tile
- Each tap triggers a server-side `reveal-tile` action (atomic to prevent race conditions)
- Tile flip outcome:

| Revealed colour | Effect |
|---|---|
| Own team's colour | Tile revealed; `guessesRemaining--`. If 0 → end turn. If all team tiles found → win round. |
| Opponent's colour | Tile revealed (opponent's tile claimed); turn ends |
| Neutral | Tile revealed; turn ends |
| Bomb | Tile revealed; `bombTriggeredBy = currentTeam`; round ends — that team loses |

- Any Field Agent (active team only) can tap **"Pass"** at any time to end the turn voluntarily
- After turn ends → `currentTeam` switches, `turnPhase = "giving-clue"`, `clue = null`, `clueNumber = null`

### `round-over`

- Entered when a round ends (all team tiles found, or Bomb triggered)
- `roundWinner` set; `roundHistory` appended; scores updated
- All players see the round result screen with scores
- Host taps **Next Round** → `assignTiles()` runs with a fresh 25-word set, `bigClueUsedRed/Blue` reset, `round++`, phase returns to `playing`
- If `redWins >= targetWins` or `blueWins >= targetWins` → phase = `game-over` instead

### `game-over`

- Final winner displayed with full score history
- Host taps **Play Again** → resets all state (keeps players and config), returns to `lobby`

---

## Tiebreaker / Special Flows

### Bomb Triggered
```
bombTriggeredBy = currentTeam
roundWinner = opposite team
→ score update (see Scoring)
→ phase = "round-over"
```

### All Tiles Revealed (no bomb)
```
if all red tiles revealed → roundWinner = "red"
if all blue tiles revealed → roundWinner = "blue"
→ score update
→ phase = "round-over"
```

### Unlimited Guesses (clueNumber = 0)
Not supported. Minimum clue number is 1.

---

## Scoring

Points accumulate across rounds. Round wins are tracked separately.

| Event | Points |
|---|---|
| Win a round normally | +500 to winner |
| Win because opponent triggered the Bomb | +800 to winner |
| Trigger the Bomb (lose round) | −300 to that team |
| Win a round AND used at least one clue of number ≥ 3 | +200 bonus to winner |

**Score calculation at round end:**

```
if bombTriggered:
  winner.points += 800
  loser.points  -= 300
else:
  winner.points += 500

if !bombTriggered && winnerUsedBigClue:
  winner.points += 200
```

---

## Host Configuration Options

| Option | Type | Default | Description |
|---|---|---|---|
| `packId` | string | `""` | Word pack to use — required before start |
| `targetWins` | number | `3` | Round wins needed to win the game |

---

## Word Packs

Single words only (not pairs). Words come from the Supabase `words` table via `word_a` — `word_b` is ignored. Packs are registered in `word_packs` with `game = "mindfield"`.

Expected packs (to be seeded in Supabase):

| Pack Name | Category |
|---|---|
| General | Mixed everyday words |
| Bollywood | Hindi cinema actors, movies, songs |
| Cricket | Players, terms, tournaments |
| Food | Indian dishes and snacks |
| Hyderabad | City landmarks, culture, slang |
| College Life | Student life, campus, exams |

`assignTiles()` selects 25 unique random words from the chosen pack and distributes colours: 9 red, 8 blue, 7 neutral, 1 bomb — shuffled randomly each round.

---

## Implemented Screens / Components

| Component | Phase / Role | File Path |
|---|---|---|
| `LobbyScreen` | `lobby` | `src/games/mindfield/components/LobbyScreen.tsx` |
| `SpymasterView` | `playing` — spymaster | `src/games/mindfield/components/SpymasterView.tsx` |
| `AgentView` | `playing` — agent | `src/games/mindfield/components/AgentView.tsx` |
| `WordCard` | used in both views | `src/games/mindfield/components/WordCard.tsx` |
| `ClueInput` | `giving-clue` sub-component | `src/games/mindfield/components/ClueInput.tsx` |
| `BombReveal` | full-screen bomb overlay | `src/games/mindfield/components/BombReveal.tsx` |
| `RoundOverScreen` | `round-over` | `src/games/mindfield/components/RoundOverScreen.tsx` |
| `GameOverScreen` | `game-over` | `src/games/mindfield/components/GameOverScreen.tsx` |
| `RulesModal` | any phase | `src/games/mindfield/components/RulesModal.tsx` |

---

## State Shape Reference

```ts
// src/games/mindfield/types.ts

export type TeamColor = "red" | "blue";
export type TileColor = "red" | "blue" | "neutral" | "bomb";
export type PlayerRole = "spymaster" | "agent";
export type TurnPhase = "giving-clue" | "guessing";
export type GamePhase = "lobby" | "playing" | "round-over" | "game-over";

export interface Tile {
  id: number;           // 0–24 (row * 5 + col)
  word: string;
  color: TileColor;     // always present; agents' UI only renders revealed colors
  revealed: boolean;
}

export interface Player {
  id: string;
  name: string;
  team: TeamColor | null;
  role: PlayerRole | null;
  isHost: boolean;
  joinedAt: number;
}

export interface RoundRecord {
  round: number;
  winner: TeamColor;
  bombTriggered: boolean;
  bombTriggeredBy: TeamColor | null;
  winnerUsedBigClue: boolean;
  redPointsEarned: number;
  bluePointsEarned: number;
}

export interface GameConfig {
  packId: string;
  targetWins: number;
}

export const DEFAULT_CONFIG: GameConfig = {
  packId: "",
  targetWins: 3,
};

export interface GameState {
  roomCode: string;
  phase: GamePhase;
  players: Player[];
  config: GameConfig;

  // Grid
  tiles: Tile[];              // always 25 during/after playing; [] in lobby

  // Turn
  currentTeam: TeamColor;
  turnPhase: TurnPhase;
  clue: string | null;
  clueNumber: number | null;
  guessesRemaining: number;   // clueNumber + 1 at start of guessing; decrements on correct guess

  // Round tracking
  bigClueUsedRed: boolean;    // Red used a clue of number >= 3 this round
  bigClueUsedBlue: boolean;   // Blue used a clue of number >= 3 this round
  roundWinner: TeamColor | null;
  bombTriggeredBy: TeamColor | null;

  // Game totals
  redWins: number;            // round wins
  blueWins: number;
  redPoints: number;          // cumulative score points
  bluePoints: number;
  winner: TeamColor | null;   // game winner (set when targetWins reached)

  // History
  roundHistory: RoundRecord[];
  round: number;
  createdAt: number;
}
```

---

## Win Condition Logic

### Round win check — called after every tile reveal

```
redTiles   = tiles where color === "red"
blueTiles  = tiles where color === "blue"

if bombTriggeredBy !== null:
  roundWinner = opposite of bombTriggeredBy
  → applyRoundScores(roundWinner, bombTriggered=true)
  → phase = "round-over"
  return

if all redTiles are revealed:
  roundWinner = "red"
  → applyRoundScores("red", bombTriggered=false)
  → phase = "round-over"
  return

if all blueTiles are revealed:
  roundWinner = "blue"
  → applyRoundScores("blue", bombTriggered=false)
  → phase = "round-over"
  return

// no winner yet — continue
```

### applyRoundScores(winner, bombTriggered)

```
loser = opposite of winner

if bombTriggered:
  winner.points += 800
  loser.points  -= 300
else:
  winner.points += 500
  winnerUsedBigClue = (winner === "red" ? bigClueUsedRed : bigClueUsedBlue)
  if winnerUsedBigClue:
    winner.points += 200

winner.wins += 1

roundHistory.push({ round, winner, bombTriggered, bombTriggeredBy, winnerUsedBigClue, ... })
```

### Game win check — called after applyRoundScores

```
if redWins >= config.targetWins:
  winner = "red"
  phase  = "game-over"
  return

if blueWins >= config.targetWins:
  winner = "blue"
  phase  = "game-over"
  return

// no game winner — phase = "round-over" to start next round
```
