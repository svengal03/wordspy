# 〰️ Wavelength — Game Document

## Overview

Wavelength is a **team-based spectrum guessing game** for 4–12 players. Two teams compete to read each other's minds across a hidden spectrum. Each round, one player — the **Psychic** — secretly sees where a target lands on a spectrum between two opposite concepts (e.g., "Hot ↔ Cold"). The Psychic gives a **single clue** to help their team place a needle on the spectrum. The opposing team then bets whether the true target sits to the **left or right** of the needle, earning a bonus point for a correct guess.

Offline pass-the-phone only — no online/multiplayer mode.

---

## Objective

| Team | Win By |
|---|---|
| Team A / Team B | First to reach the configured **target score** (default: 10 points) |

If both teams reach the target score in the same round, the team with the higher score wins. If still tied, game continues until one team leads.

---

## Teams

### Team A / Team B
- **Count:** 2–6 players per team; 2 teams total
- **Minimum:** 4 players total (2 per team)
- **Psychic:** One rotating player from the active team — changes each round that team plays
- **Win condition:** Reach `config.targetScore` points first
- **Strategy (Psychic):** Choose a clue specific enough to be directional, not so obvious it trivialises the guess
- **Strategy (Team):** Discuss a range before committing — don't anchor on the first position someone suggests
- **Strategy (Opposing):** Watch for asymmetric clues — if the Psychic said "lukewarm" on Hot ↔ Cold, the target is almost certainly left of center

---

## Team Assignment

Host assigns players during `team-assign` phase. Two modes:

- **Random (default):** Players shuffled, split evenly — first half → Team A, second half → Team B. Odd player count → Team A gets the extra player.
- **Manual:** Host taps each player name to toggle between Team A and Team B.

**Psychic rotation:** Each team has a `psychicIndex`. After each round a team acts as the Psychic team, their `psychicIndex` increments (wraps around when it exceeds team size). This ensures every player on a team takes turns as Psychic.

**Starting team:** Team A is always the Psychic team in Round 1.

---

## Game Phases

```
setup → team-assign → clue → guess → opposing-bet → reveal → (next round or game-over)
```

### `setup`
- Host enters all player names (4–12 players) using `PlayerNameInput`
- Host configures options (target score, spectrum pack, opposing bet toggle)
- Host taps **Set Up Teams** → transitions to `team-assign`

### `team-assign`
- All player names shown, split into Team A and Team B (random by default)
- Host can tap any player to toggle their team assignment
- Both teams must have at least 2 players before proceeding
- Host taps **Start Game** → `startGame()` runs:
  - Sets `round = 1`, `currentTeamId = "A"`
  - Sets `currentPsychicId` to Team A's player at `psychicIndex = 0`
  - Draws `currentCard` from the spectrum pack (not in `usedCardIds`)
  - Generates `targetPosition` randomly in range [10, 90]
  - Transitions to `clue`

### `clue`
- Screen instructs group: pass phone to the Psychic **alone**, face down
- Psychic taps to reveal: sees the spectrum card (left ↔ right labels) with a **target indicator** showing the exact position on the bar
- Psychic types their clue (one word or short phrase, no restrictions enforced by app)
- Psychic taps **Submit Clue** → `submitClue(clue)` runs, transitions to `guess`
- Phone returned to the group

### `guess`
- The **Psychic's team** (excluding the opposing team — honour system) sees:
  - Spectrum bar with left and right labels
  - Psychic's clue prominently displayed
  - A draggable needle, initially at position 50 (center)
  - A countdown timer bar (if `config.guessTimerSeconds > 0`); turns red below 10s; auto-locks needle at current position when it hits 0
- Team discusses openly and drags the needle to consensus position
- One player taps **Lock In** → `lockNeedle(position)` runs (or timer fires it automatically)
- If `config.enableOpposingBet = true` → transitions to `opposing-bet`
- If `config.enableOpposingBet = false` → transitions to `reveal`

### `opposing-bet`
- Phone passed to the **opposing team**
- Opposing team sees: spectrum bar with labels, Psychic's clue, and the **locked needle position** (target still hidden)
- Team discusses and decides: is the actual target to the **Left** or **Right** of the needle?
- One player taps **Left** or **Right** → `submitOpposingBet(bet)` runs, transitions to `reveal`

### `reveal`
- Everyone sees the full spectrum bar with **target position** animated in
- Score zones revealed with colour coding:
  - **Bullseye** (distance ≤ 5): **4 points** — deep coral
  - **Close** (5 < distance ≤ 15): **3 points** — medium coral
  - **Almost** (15 < distance ≤ 25): **2 points** — light coral
  - **Miss** (distance > 25): **0 points** — neutral
- Opposing team bet result shown (correct = **+1 point** to opposing team)
- Both teams' total scores updated and displayed
- `checkWinCondition()` runs — if winner found → `game-over`
- Host taps **Next Round** → `nextRound()` runs:
  - Increments `round`
  - Switches `currentTeamId` to the other team
  - Increments `psychicIndex` for the team that just played (mod team size)
  - Draws new `currentCard` (not in `usedCardIds`; reshuffles used pile if pack exhausted)
  - Generates new `targetPosition` in [10, 90]
  - Transitions to `clue`

### `game-over`
- Displays winning team name and final scores
- Shows full round history: each clue, card, needle vs. target, scores
- Host taps **Play Again** → resets to `setup`

---

## Tiebreaker / Special Flows

### Both Teams Reach Target Score Same Round
1. Team with higher score wins
2. If scores are exactly equal → game continues; `targetScore` effectively increments by 1 until one team leads after a full round

### Needle Exactly on Target
`targetPosition === needlePosition` → score is Bullseye (4 points). Opposing team cannot bet left/right on an exact hit — opposing bet is skipped and they score 0 for that round.

### Pack Exhaustion
If all cards in the selected pack have been used, `usedCardIds` is cleared and the pack reshuffles. Tracks used cards in `usedCardIds` to avoid repeating within a session.

---

## Host Configuration Options

| Option | Type | Default | Description |
|---|---|---|---|
| `targetScore` | number | `10` | Points needed to win |
| `enableOpposingBet` | boolean | `true` | Opposing team earns +1 per round for correct left/right guess |
| `randomTeams` | boolean | `true` | Auto-assign teams randomly on `team-assign` load |
| `packId` | string | `"general"` | Spectrum card pack to use |
| `guessTimerSeconds` | number | `60` | Seconds the guessing team has to lock in the needle; `0` disables the timer |

---

## Spectrum Packs

Wavelength uses **spectrum card pairs** — two opposite labels defining the ends of a bar. This is a different format from Wordspy's word pairs.

**Requires adding `spectrumPacks` to `@playhub/core`.** Format:

```ts
interface SpectrumCard {
  id: string
  left: string   // left-end label
  right: string  // right-end label
}
```

Add a `getSpectrumPack(packId: string): SpectrumCard[]` export to `@playhub/core`.

### Pack: `general` (default, 40 pairs)

| Left | Right |
|---|---|
| Hot | Cold |
| Loud | Quiet |
| Fast | Slow |
| Spicy | Bland |
| Formal | Casual |
| Boring | Exciting |
| Traditional | Modern |
| Cheap | Expensive |
| Simple | Complex |
| Famous | Unknown |
| Healthy | Junk |
| Introvert | Extrovert |
| Serious | Funny |
| Safe | Risky |
| City | Village |
| Morning person | Night owl |
| Work | Vacation |
| Hero | Villain |
| Romantic | Practical |
| Calm | Intense |
| Realistic | Fantastical |
| Ancient | New |
| Rare | Common |
| Easy | Hard |
| Action | Drama |
| Classic | Trendy |
| Solo | Team player |
| Logical | Emotional |
| Indoors | Outdoors |
| Optimist | Pessimist |
| Vegetarian | Non-Veg |
| Summer | Winter |
| Mountains | Beach |
| Light | Heavy |
| Minimalist | Maximalist |
| Talker | Listener |
| Street food | Fine dining |
| Comedy | Tragedy |
| Digital | Analog |
| Conservative | Bold |

### Pack: `bollywood` (20 pairs)

| Left | Right |
|---|---|
| Comedy | Thriller |
| Black & White era | Colour era |
| Solo hero | Ensemble cast |
| Romantic | Action |
| Old Bollywood | New Bollywood |
| Melodramatic | Realistic |
| Villain | Hero |
| Playback singer | Rapper |
| Regional film | Mainstream Hindi |
| Slow burn | Fast-paced |
| Item song | Title track |
| Arthouse | Masala |
| Remake | Original |
| Daytime drama | Night thriller |
| Dialogue-heavy | Song-heavy |
| Solo actor | Duo chemistry |
| Tragedy | Happy ending |
| Period film | Contemporary |
| Family drama | College romance |
| Serious | Slapstick |

### Pack: `south-food` (20 pairs)

| Left | Right |
|---|---|
| Idli | Paratha |
| Coconut | Mustard |
| Mild | Fiery |
| Rice | Wheat |
| Steamed | Fried |
| Tangy | Creamy |
| Crispy | Soft |
| Sweet | Savory |
| Filter coffee | Chai |
| Breakfast | Dinner |
| Dry curry | Gravy |
| Fermented | Fresh |
| Banana leaf | Steel plate |
| Coastal | Inland |
| Light meal | Heavy feast |
| Tamarind | Lemon |
| Street snack | Home-cooked |
| Veg | Non-Veg |
| Quick prep | Slow cook |
| Minimalist | Loaded |

---

## Implemented Screens / Components

| Component | Phase | File |
|---|---|---|
| `SetupScreen` | setup | `components/game/SetupScreen.tsx` |
| `TeamAssignScreen` | team-assign | `components/game/TeamAssignScreen.tsx` |
| `ClueScreen` | clue | `components/game/ClueScreen.tsx` |
| `GuessScreen` | guess | `components/game/GuessScreen.tsx` |
| `OpposingBetScreen` | opposing-bet | `components/game/OpposingBetScreen.tsx` |
| `RevealScreen` | reveal | `components/game/RevealScreen.tsx` |
| `GameOverScreen` | game-over | `components/game/GameOverScreen.tsx` |
| `RulesModal` | any | `components/game/RulesModal.tsx` |

---

## State Shape Reference

```ts
// lib/types.ts

type GamePhase =
  | "setup"
  | "team-assign"
  | "clue"
  | "guess"
  | "opposing-bet"
  | "reveal"
  | "game-over"

type TeamId = "A" | "B"
type OpposingBet = "left" | "right"
type ScoreZone = "bullseye" | "close" | "almost" | "miss"

interface SpectrumCard {
  id: string
  left: string
  right: string
}

interface Player {
  id: string
  name: string
  teamId: TeamId
}

interface Team {
  id: TeamId
  score: number
  psychicIndex: number  // index into this team's player list; wraps on increment
}

interface RoundResult {
  round: number
  psychicTeamId: TeamId
  psychicName: string
  cardLeft: string
  cardRight: string
  clue: string
  targetPosition: number
  needlePosition: number
  zone: ScoreZone
  pointsScored: number          // points awarded to psychic team
  opposingBet: OpposingBet | null
  opposingBetCorrect: boolean | null
  opposingPointsScored: number  // 0 or 1
}

interface GameConfig {
  targetScore: number
  enableOpposingBet: boolean
  randomTeams: boolean
  packId: string
  guessTimerSeconds: number  // 0 = disabled
}

const DEFAULT_CONFIG: GameConfig = {
  targetScore: 10,
  enableOpposingBet: true,
  randomTeams: true,
  packId: "general",
  guessTimerSeconds: 60,
}

interface GameState {
  phase: GamePhase
  players: Player[]
  teams: [Team, Team]             // index 0 = Team A, index 1 = Team B
  config: GameConfig
  round: number
  currentTeamId: TeamId
  currentPsychicId: string | null
  currentCard: SpectrumCard | null
  targetPosition: number          // 0–100; only revealed to Psychic during clue phase
  clue: string | null
  needlePosition: number          // 0–100; default 50; set during guess phase
  opposingBet: OpposingBet | null
  lastResult: RoundResult | null
  history: RoundResult[]
  winner: TeamId | null
  usedCardIds: string[]
}
```

---

## Win Condition Logic

```
ZONE_POINTS = { bullseye: 4, close: 3, almost: 2, miss: 0 }

getScoreZone(targetPosition, needlePosition) → ScoreZone:
  distance = |needlePosition - targetPosition|
  if distance ≤ 5  → "bullseye"
  if distance ≤ 15 → "close"
  if distance ≤ 25 → "almost"
  otherwise        → "miss"

evaluateOpposingBet(targetPosition, needlePosition, bet) → boolean | null:
  if targetPosition === needlePosition → null
  if bet === "left"  → targetPosition < needlePosition
  if bet === "right" → targetPosition > needlePosition

checkWinCondition(teams, config) → TeamId | null:
  aWins = teams[0].score >= config.targetScore
  bWins = teams[1].score >= config.targetScore

  if aWins && bWins:
    if teams[0].score > teams[1].score → "A"
    if teams[1].score > teams[0].score → "B"
    → null  // exact tie: continue until one leads after a full round

  if aWins → "A"
  if bWins → "B"
  → null
```
