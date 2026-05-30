# 〰️ Wavelength — Game Document

## Overview

Wavelength is a spectrum-based team game for **4–12 players** split into two teams. Each round one player (the Psychic) sees a hidden target position on a spectrum dial and gives a single-word clue to guide their team. The opposing team earns a bonus point by betting which side of the dial the target is on. First team to reach the target score wins.

Pass-the-phone. Offline only. No network calls.

---

## Objective

| Who wins | Condition |
|---|---|
| Team A | First to reach `config.targetScore` points |
| Team B | First to reach `config.targetScore` points |

If both teams reach the target score in the same reveal, the team with the higher score wins. Exact tie → continue playing until broken.

---

## Roles / Teams

### Psychic (rotating within team)

- One player per round, rotates each turn within the active team
- Sole player who sees the spectrum card AND the hidden target position
- Gives one-word clue that places the target on the spectrum
- Cannot gesture, point, or describe position directly

### Guesser (all other members of the active team)

- Drag the needle on the dial to their collective best guess
- Discuss openly; the Psychic must stay silent after giving the clue

### Opposing Team

- After the needle is locked, bets "left" or "right" of the needle to earn a +1 bonus
- Correct bet = +1 point regardless of the active team's score

---

## Team Assignment

Host enters player names and either assigns teams manually or uses random auto-split (default). Auto-split shuffles players and assigns the first ⌈n/2⌉ to Team A, the rest to Team B.

---

## Game Phases

### `lobby`

Host enters their name. Navigates to setup.

### `setup`

Host configures:
- Target score (default 10)
- Enable opposing bet (default on)
- Random teams (default on)
- Spectrum pack (required)
- Guess timer in seconds (default 60; 0 = disabled)

### `team-assign`

Players enter names. If `config.randomTeams`, teams are shuffled automatically. Otherwise host drags names between teams. Both teams must have at least 1 player each.

### `clue`

- Phone passed to the active team's current Psychic (face-down; tap to reveal)
- Psychic sees: spectrum card (e.g. "Cold ↔ Hot"), hidden target position marker
- Psychic types one-word clue and submits
- `phase → "guess"`

State changes: `clue` is set.

### `guess`

- Active team sees the spectrum dial and the Psychic's clue (target hidden)
- Players drag the needle; optional timer counts down from `config.guessTimerSeconds`
- Host taps "Lock" to freeze the needle
- `phase → "opposing-bet"` (if `config.enableOpposingBet`) or `"reveal"`

State changes: `needlePosition` is set.

### `opposing-bet`

- Opposing team sees the spectrum card, the Psychic's clue, and the locked needle position (target still hidden)
- Must vote "Left of needle" or "Right of needle"
- `phase → "reveal"`

State changes: `opposingBet` is set.

### `reveal`

`resolveReveal()` runs:
1. Compute `zone = getScoreZone(targetPosition, needlePosition)`
2. Award points to active team (zone points) and opposing team (opposing bet bonus)
3. Update team scores
4. Check win condition → if winner, `phase → "game-over"`
5. Otherwise stay on `"reveal"` until host taps "Next Round"

State changes: `lastResult`, `history`, `teams.score` updated; `winner` set or null.

On "Next Round":
- Active team rotates to opposing team (`currentTeamId` flips A↔B)
- Active team's `psychicIndex` increments (mod team size)
- New card drawn (avoid repeats); new `targetPosition` randomised; `needlePosition` reset to 50

### `game-over`

Displays final scores and winner. Host can restart.

---

## Tiebreaker

If both teams cross `targetScore` in the same reveal: higher score wins. If scores are equal → no winner returned, game continues.

---

## Host Configuration Options

| Option | Type | Default | Description |
|---|---|---|---|
| `targetScore` | `number` | `10` | Points needed to win |
| `enableOpposingBet` | `boolean` | `true` | Whether opposing team bets after needle lock |
| `randomTeams` | `boolean` | `true` | Auto-shuffle team assignment |
| `packId` | `string` | `""` | Spectrum pack ID (required to start) |
| `guessTimerSeconds` | `number` | `60` | Guess phase timer; `0` = disabled |

---

## Spectrum Packs

Spectrum cards are loaded from Supabase (`wordpacks` table, category `"wavelength"`). Each card has two poles: `word_a` (left) and `word_b` (right). The Psychic sees both poles plus the hidden target.

Cards are drawn without replacement until the pool is exhausted, then the full pool resets.

---

## Implemented Screens / Components

| Component | Phase | Path |
|---|---|---|
| `SetupScreen` | `lobby` → `setup` → `team-assign` | `src/games/wavelength/components/SetupScreen.tsx` |
| `ClueScreen` | `clue` | `src/games/wavelength/components/ClueScreen.tsx` |
| `GuessScreen` | `guess` | `src/games/wavelength/components/GuessScreen.tsx` |
| `OpposingBetScreen` | `opposing-bet` | `src/games/wavelength/components/OpposingBetScreen.tsx` |
| `RevealScreen` | `reveal` | `src/games/wavelength/components/RevealScreen.tsx` |
| `GameOverScreen` | `game-over` | `src/games/wavelength/components/GameOverScreen.tsx` |
| `SpectrumDial` | (shared sub-component) | `src/games/wavelength/components/SpectrumDial.tsx` |
| `RulesModal` | all screens | `src/games/wavelength/components/RulesModal.tsx` |

---

## State Shape Reference

```ts
type GamePhase =
  | "lobby"
  | "setup"
  | "team-assign"
  | "clue"
  | "guess"
  | "opposing-bet"
  | "reveal"
  | "game-over";

type TeamId = "A" | "B";
type OpposingBet = "left" | "right";
type ScoreZone = "bullseye" | "close" | "almost" | "miss";

interface SpectrumCard {
  id: string;
  left: string;
  right: string;
}

interface Player {
  id: string;
  name: string;
  teamId: TeamId;
}

interface Team {
  id: TeamId;
  score: number;
  psychicIndex: number; // index into team's player array; mod team size
}

interface RoundResult {
  round: number;
  psychicTeamId: TeamId;
  psychicName: string;
  cardLeft: string;
  cardRight: string;
  clue: string;
  targetPosition: number;   // [10, 90]
  needlePosition: number;   // [0, 100]
  zone: ScoreZone;
  pointsScored: number;
  opposingBet: OpposingBet | null;
  opposingBetCorrect: boolean | null;
  opposingPointsScored: number;
}

interface GameConfig {
  targetScore: number;
  enableOpposingBet: boolean;
  randomTeams: boolean;
  packId: string;
  guessTimerSeconds: number;
}

const DEFAULT_CONFIG: GameConfig = {
  targetScore: 10,
  enableOpposingBet: true,
  randomTeams: true,
  packId: "",
  guessTimerSeconds: 60,
};

interface GameState {
  phase: GamePhase;
  hostName: string;
  players: Player[];
  teams: [Team, Team];          // index 0 = Team A, index 1 = Team B
  config: GameConfig;
  round: number;
  currentTeamId: TeamId;
  currentPsychicId: string | null;
  currentCard: SpectrumCard | null;
  targetPosition: number;       // hidden from guessers; random [10, 90]
  clue: string | null;
  needlePosition: number;       // starts at 50; guessers drag this
  opposingBet: OpposingBet | null;
  lastResult: RoundResult | null;
  history: RoundResult[];
  winner: TeamId | null;
  usedCardIds: string[];
}
```

---

## Win Condition Logic

```
function checkWinCondition(teams, config):
  aWins = teams[A].score >= config.targetScore
  bWins = teams[B].score >= config.targetScore

  if aWins AND bWins:
    if teams[A].score > teams[B].score → return "A"
    if teams[B].score > teams[A].score → return "B"
    return null  // exact tie — continue

  if aWins  → return "A"
  if bWins  → return "B"
  return null
```

Score zone thresholds (distance = |targetPosition − needlePosition|):

| Zone | Distance | Points |
|---|---|---|
| bullseye | ≤ 5 | 4 |
| close | ≤ 15 | 3 |
| almost | ≤ 25 | 2 |
| miss | > 25 | 0 |
