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
- `Map<string, GameState>` in Node.js module scope
- Persists within a serverless function instance
- Rooms auto-expire after 4 hours
- **Caveat:** Vercel may spin up multiple instances — for production, replace with Redis (Upstash free tier)

### Client (Zustand)
```ts
interface GameStore {
  localPlayer: Player | null      // This device's player identity
  roomCode: string | null         // Current room
  gameState: GameState | null     // Full game state (Ably-synced)
  config: GameConfig              // Host configuration
  isOffline: boolean              // Offline mode flag
  revealIndex: number             // Which player is currently revealing (offline)
}
```

---

## Game Engine (Pure Functions)

All game logic lives in `lib/gameEngine.ts` as **pure functions** — no side effects, no network calls:

```
startGame(state)          → GameState (roles assigned, phase = "role-reveal")
submitClue(state, id, clue) → GameState (clue recorded, maybe phase change)
castVote(state, voter, target) → GameState (vote recorded, maybe elimination)
processGhostGuess(state, guess) → GameState (win check, or next round)
nextRound(state)          → GameState (reset clues/votes, increment round)
checkWinCondition(state)  → "civilians" | "undercover" | "ghost" | null
```

This makes the logic **fully testable** and easy to reason about.

---

## Realtime Architecture (Ably)

### Why Ably over Socket.io?
- No server to manage — works with Vercel's serverless model
- Free tier: 200 concurrent connections, 6M messages/month
- Never cold-starts (unlike Render free tier)
- Built-in presence, history, and token auth

### Channel naming
```
wordspy:{ROOM_CODE}    e.g. wordspy:ABC123
```

### Event types
```ts
type AblyEventType =
  | "game-state-update"   // full state snapshot (most common)
  | "player-joined"       // new player joined lobby
  | "player-left"         // player disconnected
  | "chat-message"        // inline chat (also in game-state-update)
  | "phase-change"        // explicit phase transition
  | "host-action"         // host-only commands
```

### Token Auth (security)
Players never have access to the raw Ably API key. Instead:
1. Browser calls `/api/ably-token`
2. Server uses the API key to sign a **token request**
3. Browser uses the token — limited permissions, expires

---

## Offline Mode Architecture

Offline mode is entirely **client-side** — no Ably, no API calls after initial page load:

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

- **Ably token auth** — API key never exposed to browser
- **No user accounts** — no PII stored
- **Room codes** — 6-character random codes, expire after 4 hours
- **Host validation** — only host can start game / change config (enforced client-side; for production, add server-side role validation)

---

## Performance

- **No database calls** during gameplay — all state via Ably
- **Full snapshots** over deltas — simpler code, negligible bandwidth for party game payloads (~2-5KB per event)
- **DM Sans** loaded via Google Fonts with `display=swap` — no layout shift
- **Framer Motion** — only animates on mount/exit, no continuous animations
