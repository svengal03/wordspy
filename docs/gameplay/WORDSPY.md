# 🕵️ Wordspy — Game Document

## Overview

Wordspy is a **social deduction word game** for 3–10 players. Players are secretly assigned roles and a word. Through one-word clues and discussion, Civilians try to find and eliminate the Undercover agents and the Ghost before being outnumbered. The Undercover and Ghost try to blend in.

Supports **online multiplayer** (each player on their own device via Pusher) and **offline pass-the-phone** mode.

---

## Objective

| Role | Win By |
|---|---|
| 🎭 Civilians | Eliminating all Undercovers and Ghosts |
| 🕵️ Undercover | Surviving until only 1 Civilian remains |
| 👻 Ghost | Surviving to the final 2, OR correctly guessing the Civilian word on elimination |

---

## Roles / Teams

### 🎭 Civilian
- Receives the **main secret word** (all Civilians share the same word)
- Must give clues that are clear to fellow Civilians but don't expose the word to the Ghost
- **Strategy:** Be specific enough to find allies; watch for clues that are subtly off

### 🕵️ Undercover
- Receives a **similar but different word** to the Civilians
- Must blend in — give plausible clues that could work for both words
- 1–2 players depending on group size
- **Strategy:** Don't overthink — your word is close. Vote convincingly. Deflect suspicion

### 👻 Ghost
- Receives **no word** — must improvise entirely from listening to others
- If eliminated, gets one chance to guess the Civilian word (correct = Ghost wins immediately)
- **Strategy:** Give generic but plausible clues. Listen first, act second

---

## Role Assignment

Roles are randomly assigned via `assignRoles()`. The word pair can be randomly swapped (civilian↔undercover) for variety.

**With Ghost enabled (default):**

| Players | Civilians | Undercovers | Ghosts |
|---|---|---|---|
| 3 | 1 | 1 | 1 |
| 4 | 2 | 1 | 1 |
| 5 | 3 | 1 | 1 |
| 6 | 4 | 1 | 1 |
| 7 | 4 | 2 | 1 |
| 8 | 5 | 2 | 1 |
| 9 | 6 | 2 | 1 |
| 10 | 7 | 2 | 1 |

**With Ghost disabled (`ghostCount = 0`):**

| Players | Civilians | Undercovers |
|---|---|---|
| 3 | 2 | 1 |
| 4 | 3 | 1 |
| 5 | 4 | 1 |
| 6 | 5 | 1 |
| 7 | 5 | 2 |
| 8 | 6 | 2 |

---

## Game Phases

```
lobby → role-reveal → clue → discussion → vote → [host-pick] → elimination → (repeat or summary)
```

### `lobby`
- Host creates a room, shares room code
- Players join on their own devices (online) or host adds names (offline)
- Host picks Word Pack and configures options
- Host taps **Start Game**

### `role-reveal`
- Each player privately views their secret word
- **Online:** Each player taps "Reveal" on their own device in any order
- **Offline:** Phone passed face-down; each player taps to reveal, then passes on

### `clue`
- Starting from a randomly selected player, each active player gives **one clue**
- A clue must be a **single word** — spaces not allowed
- Clues must be **truthful** — no lying about your word
- **Duplicate clues** are rejected — the same word cannot be used twice in a round
- In a tiebreaker: only the tied players re-clue; everyone else still revotes
- The `currentCluePlayerIndex` tracks whose turn it is; advances after each submission

### `discussion`
- Auto-entered when all active players have given clues
- Open debate — no app enforcement, players talk freely
- Chat panel available in online mode
- No timer — discussion ends when host (or players) decide

### `vote`
- Each active player votes for who they suspect
- **Online:** Players tap a name on their own device
- **Offline:** Host tallies verbally; `currentVoterIndex` advances per vote
- When all players have voted → `processVotes()` runs automatically
- `showVotesLive`: if enabled, vote counts are visible in real time

### `host-pick`
- Entered when there is a tie AND `tieBreaker` is disabled
- Host manually selects which tied player to eliminate

### `elimination`
- The eliminated player's role and word are revealed to everyone
- If the eliminated player is the **Ghost**: they get one chance to guess the Civilian word
  - Correct → Ghost wins immediately (`phase = "summary"`, `winner = "ghost"`)
  - Wrong → game continues (`nextRound()`)
- Otherwise → `checkWinCondition()` runs; if no winner → `nextRound()`

### `summary`
- Displays the winner, all roles, and the word pair
- Option to play again (resets to `lobby`)

---

## Tiebreaker Flow

When `tieBreaker = true` and votes are tied:
1. Only tied players give **one more clue** each (`isTiebreaker = true`)
2. All active players **revote** between only the tied players
3. If still tied → `host-pick`

---

## Host Configuration Options

| Option | Type | Default | Description |
|---|---|---|---|
| `packId` | string | `"bollywood"` | Word pack to use |
| `undercoverCount` | number | `1` | How many Undercover players |
| `ghostCount` | number | `1` | 0 = no Ghost role |
| `safeRound` | boolean | `false` | No elimination in Round 1 |
| `tieBreaker` | boolean | `false` | Re-clue + revote on ties |
| `jurySystem` | boolean | `false` | Eliminated players cast 1 jury vote in final round |
| `showVotesLive` | boolean | `false` | Show vote tallies in real time during voting |

---

## Word Packs

Words come from `@playhub/core` via `getRandomPair(packId)`. Each pack contains pairs of similar words `{ civilian, undercover }`. The word pair can be randomly swapped (civilian↔undercover) each game for variety.

Available packs: `bollywood`, `tollywood`, `south-food`, `north-food`.

---

## Online Mode (Pusher)

- Host creates a room → server generates room code, creates `GameState` in memory
- All clients subscribe to Pusher channel `wordspy-{ROOM_CODE}`
- Every action: pure function → POST `/api/rooms` (persist) → POST `/api/pusher-event` (broadcast full snapshot)
- All clients receive `game-state-update` → `setGameState()` → UI re-renders

**Room expiry:** 4 hours. Server-side in-memory store — upgrade to Redis for production multi-instance reliability.

---

## Offline Mode

- State lives entirely in Zustand on the device
- No Pusher, no API calls after page load
- `revealIndex` tracks whose turn it is to see their word
- Votes are tapped by each player in turn (`currentVoterIndex` advances)

---

## Implemented Screens / Components

| Component | Phase | File |
|---|---|---|
| `LobbySetup` | lobby | `components/game/LobbySetup.tsx` |
| `RoleReveal` | role-reveal | `components/game/RoleReveal.tsx` |
| `CluePhase` | clue | `components/game/CluePhase.tsx` |
| `VotePhase` | vote + discussion | `components/game/VotePhase.tsx` |
| `EliminationScreen` | elimination | `components/game/EliminationScreen.tsx` |
| `SummaryScreen` | summary | `components/game/SummaryScreen.tsx` |
| `RulesModal` | any | `components/game/RulesModal.tsx` |
| `ChatPanel` | online only | `components/game/ChatPanel.tsx` |

---

## State Shape Reference

```ts
// lib/types.ts
interface GameConfig {
  packId: string           // word pack to use
  playerCount: number      // total players in the game
  undercoverCount: number  // number of Undercover players
  ghostCount: number       // 0 = ghost disabled
  safeRound: boolean       // no elimination in round 1
  tieBreaker: boolean      // re-clue + revote on ties
  jurySystem: boolean      // eliminated players cast 1 jury vote in final round
  showVotesLive: boolean   // show vote tallies in real time
}

const DEFAULT_CONFIG: GameConfig = {
  packId: "bollywood",
  playerCount: 5,
  undercoverCount: 1,
  ghostCount: 1,
  safeRound: false,
  tieBreaker: false,
  jurySystem: false,
  showVotesLive: false,
}

interface GameState {
  roomCode: string
  phase: "lobby" | "role-reveal" | "clue" | "discussion" | "vote" | "host-pick" | "elimination" | "summary"
  round: number
  players: Player[]
  config: GameConfig
  wordPair: { civilian: string; undercover: string } | null
  currentCluePlayerIndex: number
  currentVoterIndex: number
  eliminatedThisRound: string | null
  ghostGuessAllowed: boolean
  ghostGuess: string | null
  winner: "civilians" | "undercover" | "ghost" | null
  isTiebreaker: boolean
  chat: ChatMessage[]
  createdAt: number
}

interface Player {
  id: string
  name: string
  role: "civilian" | "undercover" | "ghost"
  word: string | null
  isEliminated: boolean
  isHost: boolean
  clue: string | null
  votes: number
  hasVoted: boolean
  joinedAt: number
}
```

---

## Win Condition Logic (`checkWinCondition`)

```
active = non-eliminated players
civilians = active where role === "civilian"
undercovers = active where role === "undercover"
ghosts = active where role === "ghost"

if undercovers.length === 0 && ghosts.length === 0  → "civilians"
if undercovers.length >= civilians.length + ghosts.length  → "undercover"
otherwise → null (game continues)
```
