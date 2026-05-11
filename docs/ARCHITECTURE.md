# 🏗️ Wordspy — Architecture

## Overview

Wordspy is a **serverless, real-time party game** built on Next.js with Pusher as the realtime backbone. There is no traditional always-on backend server — all game logic runs in the browser and is coordinated via Pusher channels.

---

## System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        VERCEL                               │
│                                                             │
│  ┌─────────────────────┐    ┌──────────────────────────┐   │
│  │   Next.js Frontend  │    │  Next.js API Routes      │   │
│  │   (React + Zustand) │    │  (Serverless Functions)  │   │
│  │                     │    │                          │   │
│  │  • Home Screen      │    │  /api/pusher-event       │   │
│  │  • Lobby            │    │  /api/rooms              │   │
│  │  • Role Reveal      │    │                          │   │
│  │  • Clue Phase       │    │  In-memory room store    │   │
│  │  • Vote Phase       │    │  (Map<code, GameState>)  │   │
│  │  • Elimination      │    │                          │   │
│  │  • Summary          │    └──────────────────────────┘   │
│  └──────────┬──────────┘                                   │
│             │                                               │
└─────────────┼───────────────────────────────────────────────┘
              │
              │ WebSocket (Pusher SDK)
              │
┌─────────────▼───────────────────────────────────────────────┐
│                        PUSHER                               │
│                                                             │
│  Channel: wordspy-{ROOM_CODE}                               │
│                                                             │
│  Events published:                                          │
│  • game-state-update  → full GameState snapshot             │
│  • player-joined      → new player object                   │
│  • chat-message       → ChatMessage object                  │
│                                                             │
│  All clients subscribe → receive updates → update UI        │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Room Creation
```
Host clicks "Create Room"
  → POST /api/rooms { action: "create" }
  → Server generates room code, creates GameState
  → Returns { roomCode, gameState }
  → Host navigates to /room/{code}
  → Pusher channel subscribed: wordspy-{code}
```

### 2. Player Joins
```
Player enters code → POST /api/rooms { action: "get", roomCode }
  → Receives current GameState
  → Creates local Player object
  → Publishes "player-joined" event on Pusher channel
  → All other clients receive event → update their player list
```

### 3. Game State Updates (the core pattern)
```
Any action (clue, vote, etc.)
  → Pure function transforms GameState → new GameState
  → POST /api/rooms { action: "update", gameState }   [persists to server memory]
  → publish("game-state-update", newGameState)          [broadcasts to all players via Pusher]
  → All clients receive event → setGameState(newState) → UI re-renders
```

This **full-state-snapshot** approach (vs delta updates) keeps the code simple and avoids state conflicts.

---

## State Management

### Server (API Route)
- `Record<string, GameState>` in Node.js module scope
- Persists within a serverless function instance
- Rooms auto-expire after 4 hours (cleanup runs every 30 min via `setInterval`)
- **Caveat:** Vercel may spin up multiple instances — for production, replace with Redis (Upstash free tier)

### Client (Zustand)
```ts
interface GameStore {
  localPlayer: Player | null      // This device's player identity
  roomCode: string | null         // Current room
  gameState: GameState | null     // Full game state (Pusher-synced)
  config: GameConfig              // Host configuration
  isOffline: boolean              // Offline mode flag
  revealIndex: number             // Which player is currently revealing (offline)
}

// GameState key fields (lib/types.ts)
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
  isTiebreaker: boolean           // true when in a tiebreaker re-clue/revote cycle
  chat: ChatMessage[]
  createdAt: number               // used for 4-hour auto-cleanup
}
```

---

## Game Engine (Pure Functions)

All game logic lives in `lib/gameEngine.ts` as **pure functions** — no side effects, no network calls:

```
startGame(state)                      → GameState (roles assigned, phase = "role-reveal")
submitClue(state, id, clue)           → { state, error? } (clue recorded, duplicate check, auto-advance)
castVote(state, voterId, targetId)    → GameState (vote recorded; when all voted → processVotes)
eliminatePlayer(state, playerId)      → GameState (host-pick path: manually eliminate a tied player)
processGhostGuess(state, guess)       → GameState (correct → ghost wins; wrong → next round or civilians win)
nextRound(state)                      → GameState (reset clues/votes, increment round, random start player)
checkWinCondition(state)              → "civilians" | "undercover" | "ghost" | null
assignRoles(players, config)          → { players, pair } (shuffle roles, assign words)
createPlayer(name, isHost)            → Player
generateRoomCode()                    → string (6-char alphanumeric, ambiguous chars excluded)
```

This makes the logic **fully testable** and easy to reason about.

---

## Realtime Architecture (Pusher)

### Why Pusher over Socket.io?
- No persistent server to manage — works with Vercel's serverless model
- Free tier: 200 concurrent connections, 800K messages/day
- Never cold-starts (unlike Render free tier)
- Simple channel/event model, solid client SDK

### Channel naming
```
wordspy-{ROOM_CODE}    e.g. wordspy-ABC123
```

### Event types
```ts
// All events sent on the "game-event" Pusher event name.
// The GameEvent envelope carries type, payload, senderId, timestamp.
type GameEventType =
  | "game-state-update"   // full state snapshot (most common)
  | "player-joined"       // new player joined lobby
  | "player-left"         // player disconnected / removed
  | "clue-submitted"      // a player submitted their clue
  | "vote-cast"           // a player cast their vote
  | "ghost-guess"         // ghost submitted word guess
  | "chat-message"        // inline chat message
  | "phase-change"        // explicit phase transition
  | "host-action"         // host-only command
```

### Credentials (security)
The Pusher secret and app ID never reach the browser. The server-side API route (`/api/pusher-event`) holds `PUSHER_APP_ID` and `PUSHER_SECRET` and publishes events on behalf of clients. The browser only uses `NEXT_PUBLIC_PUSHER_KEY` and `NEXT_PUBLIC_PUSHER_CLUSTER` to subscribe.

---

## Offline Mode Architecture

Offline mode is entirely **client-side** — no Pusher, no API calls after initial page load:

```
GameState lives in Zustand store
  → Host adds players by name (no accounts)
  → Game starts → roles assigned
  → Phone passed around (revealIndex increments)
  → Clues, votes, elimination all happen locally
  → State never leaves the device
```

---

## Upgrade Path

The architecture is designed for easy upgrades:

| Now | Upgrade |
|---|---|
| In-memory room store | Redis (Upstash — 1 line change) |
| No auth | Clerk or Supabase Auth |
| Hardcoded word packs | Claude API word generator |
| Single Vercel instance | Edge runtime + Redis |
| No persistence | PostgreSQL for game history/stats |

---

## Security

- **Pusher server-side publish** — `PUSHER_SECRET` and `PUSHER_APP_ID` never exposed to browser
- **No user accounts** — no PII stored
- **Room codes** — 6-character random codes, expire after 4 hours
- **Host validation** — only host can start game / change config (enforced client-side; for production, add server-side role validation)

---

## Performance

- **No database calls** during gameplay — all state via Pusher
- **Full snapshots** over deltas — simpler code, negligible bandwidth for party game payloads (~2-5KB per event)
- **DM Sans** loaded via Google Fonts with `display=swap` — no layout shift
- **Framer Motion** — only animates on mount/exit, no continuous animations
