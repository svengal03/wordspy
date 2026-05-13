# PlayHub Codebase Audit

---

## 1. Major Bugs

### B1 — `pushState` Updates Client Before Server Confirms
**File:** [apps/wordspy/app/room/[id]/page.tsx](apps/wordspy/app/room/[id]/page.tsx#L31)
Client calls `setGameState(state)` before the `/api/rooms` fetch resolves. If the fetch fails, client diverges from server permanently. No error catch exists. Fix: move `setGameState` into the `.then()` after confirmed server write, or add try/catch that rolls back local state on failure.

### B2 — Vote Race Condition (Simultaneous Votes)
**File:** [apps/wordspy/app/room/[id]/page.tsx](apps/wordspy/app/room/[id]/page.tsx#L132)
Client updates vote state immediately, then Pusher broadcasts async. Two votes arriving within milliseconds can tally incorrectly because neither has seen the other's update. Fix: process all vote tallying server-side only; clients should only update state on confirmed broadcast, not optimistically.

### B3 — `Math.max()` Crash on Empty Active Players
**File:** [apps/wordspy/lib/gameEngine.ts](apps/wordspy/lib/gameEngine.ts#L205)
`processVotes` does `Math.max(...activePlayers.map(p => p.votes))`. If all players disconnect and `activePlayers` is empty, `Math.max()` returns `-Infinity`, breaking elimination logic. Also affects `nextRound()` at line 287 where `activePlayers[startIndex]` would be `undefined`. Fix: guard with early return if `activePlayers.length === 0`.

### B4 — Tiebreaker Resets Votes for All Players, Not Just Tied Ones
**File:** [apps/wordspy/lib/gameEngine.ts](apps/wordspy/lib/gameEngine.ts#L209)
In the tiebreaker branch, the map resets `votes`/`hasVoted` for every non-eliminated player, not just the tied ones. Non-tied players lose their cast votes, making the tiebreaker unfair. Fix: only reset `votes`/`hasVoted` for players in `topVoted`.

### B5 — Offline Mode Has No Tie Resolution Path
**File:** [apps/wordspy/app/offline/page.tsx](apps/wordspy/app/offline/page.tsx#L303)
Online mode handles ties with a "host-pick" phase. Offline mode has no equivalent — on a tie with tiebreaker disabled, the game silently skips elimination. Fix: add a "pick one of the tied players" prompt for offline host when tiebreaker is off.

### B6 — Pusher Env Vars Use Non-Null Assertion
**File:** [apps/wordspy/lib/usePusher.ts](apps/wordspy/lib/usePusher.ts#L10)
`new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, ...)` will throw a cryptic runtime error if keys are missing. Fix: add a guard that throws a clear descriptive error or gracefully disables real-time features.

---

## 2. App Flow / UX Gaps

### U1 — No Player Disconnect Handling
**File:** [apps/wordspy/app/room/[id]/page.tsx](apps/wordspy/app/room/[id]/page.tsx)
When a player disconnects mid-game, no UI update occurs — they stay visible as active, their vote slot stays open, and others can't tell. No "player left" toast or automatic skip of their turn. Fix: add a Pusher `player-disconnected` event; mark player as inactive in game state and show a notice.

### U2 — Host Leave Leaves Lobby Broken
**File:** [apps/wordspy/app/room/[id]/page.tsx](apps/wordspy/app/room/[id]/page.tsx)
If the host leaves lobby, other players see no notification and get no option to pick a new host or leave. Lobby just freezes. Fix: on host disconnect, broadcast a `host-left` event, show a prompt to remaining players to either reassign host or dissolve the room.

### U3 — Kicked Player Dead End
**File:** [apps/wordspy/app/room/[id]/page.tsx](apps/wordspy/app/room/[id]/page.tsx#L223)
Kicked players see "You were removed" with only a "Back to Home" button. No rejoin request, no explanation. Fix: show the room code and a "Request Rejoin" affordance, or at minimum explain how to get back in.

### U4 — Eliminated Players See Vote Screen With No Context
**File:** [apps/wordspy/components/game/VotePhase.tsx](apps/wordspy/components/game/VotePhase.tsx#L135)
Eliminated players see the vote UI but can't interact. No message explains why everything is disabled. Fix: show a clear "You're eliminated — spectating this round" banner instead of a dead interactive screen.

### U5 — Room Cleanup Can Wipe Active Games
**File:** [apps/wordspy/app/api/rooms/route.ts](apps/wordspy/app/api/rooms/route.ts#L9)
The 4-hour cleanup `setInterval` has no awareness of active games. A long game can get wiped mid-play, kicking all players with a "Room not found" error. Fix: check `gameState.phase !== "ended"` before deleting, or bump TTL on any state update, and add a pre-expiry warning push.

---

## 3. UI Issues

### UI1 — Modal Z-Index Behind TopBar
**File:** [apps/wordspy/components/ui/index.tsx](apps/wordspy/components/ui/index.tsx#L159)
`TopBar` has `zIndex: 10` via inline style. Modals (Rules, etc.) have no explicit z-index, so the TopBar renders on top of modal content — buttons in the upper area of a modal are unreachable. Fix: set modals to `zIndex: 50` and overlay to `zIndex: 40`.

### UI2 — Inconsistent Button Padding
**File:** [apps/wordspy/components/ui/index.tsx](apps/wordspy/components/ui/index.tsx#L67)
Base button uses `padding: "13px 24px"` but several call sites override with `"14px 16px"` or `"16px 18px"` inline. Button heights vary visually in grouped layouts. Fix: define size variants (`sm`, `md`, `lg`) in the button component; ban inline padding overrides.

### UI3 — Chat Scroll Jank on Fast Messages
**File:** [apps/wordspy/components/game/ChatPanel.tsx](apps/wordspy/components/game/ChatPanel.tsx#L18)
`scrollIntoView({ behavior: "smooth" })` fires on every message. On rapid message bursts this causes continuous scroll animation jank. Fix: debounce the scroll call or only scroll if the user is already near the bottom.

### UI4 — Vote Phase Mobile Overflow
**File:** [apps/wordspy/components/game/VotePhase.tsx](apps/wordspy/components/game/VotePhase.tsx#L130)
On screens narrower than ~360px (iPhone SE), vote cards with avatar + name + clue + vote count exceed the viewport width and clip. Fix: cap name/clue text with `text-overflow: ellipsis` and ensure cards use `width: 100%; box-sizing: border-box`.

### UI5 — Safe Round Visually Indistinguishable From Normal Vote
**File:** [apps/wordspy/components/game/VotePhase.tsx](apps/wordspy/components/game/VotePhase.tsx#L60)
The "safe round" screen renders the same background and layout as a normal vote, making it unclear this is a different phase. Fix: use a distinct background color (e.g. green tint) and a large centered "Safe Round — No Elimination" heading to break the visual pattern.

---

## Severity Summary

| ID | Issue | Severity |
|----|-------|----------|
| B1 | pushState client-ahead-of-server | Critical |
| B2 | Vote race condition | Critical |
| B5 | Offline tie resolution missing | High |
| B3 | Math.max crash on empty players | High |
| B4 | Tiebreaker resets all votes | High |
| U5 | Room cleanup wipes active games | High |
| U1 | No disconnect handling | High |
| U2 | Host leave breaks lobby | Medium |
| UI1 | Modal behind TopBar | Medium |
| U3 | Kicked player dead end | Medium |
| B6 | Pusher env non-null assertion | Medium |
| UI2 | Inconsistent button padding | Low |
| UI3 | Chat scroll jank | Low |
| UI4 | Vote card mobile overflow | Low |
| UI5 | Safe round not visually distinct | Low |
