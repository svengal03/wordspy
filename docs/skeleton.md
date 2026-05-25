# PlayHub — Architecture Design Decisions & Audit Checklist

> **Purpose:** This document describes the current architectural problems, the design decisions made, what each fix does, and exactly what the audit agent should check and change.
> **Scope:** MindField (online rooms). WordSpy is the only other game with online rooms — schema changes affect it too and are called out explicitly.

---

## How to use this document

1. Audit agent reads each section
2. For each item: inspect the current code, determine current state
3. Mark each item as one of: `✅ Already correct` / `⚠️ Partially done` / `❌ Not done`
4. Implement fixes in priority order — P0 first, P2 last
5. For schema changes — check WordSpy impact before running migrations

---

## SECTION 1 — State Storage (Schema Design)

### Problem
The entire game state lives in a single `payload` JSONB column in `game_state`. This includes tiles, players, clue history, round history, current phase — everything. One blob.

### Why this hurts
- Every tile reveal rewrites the entire 10–50KB blob
- Every read fetches the entire blob even if you only need the phase
- Concurrent writes clobber each other (last write wins)
- History accumulates in the blob and never shrinks
- No way to query individual fields without parsing the whole JSON

### Design decision
Move from one JSONB blob to a normalized relational schema. Each entity gets its own table and its own row. Updates touch only what changed.

### Target schema
```sql
-- Rooms (already exists, keep as-is)
rooms
  id, code, created_at, pack_id, status

-- Players per room
room_players
  id, room_id, player_name, team ('red'|'blue'), role ('agent'|'spymaster'), joined_at

-- One row per game round
game_rounds
  id, room_id, round_number, phase, started_at, ended_at, winner_team

-- One row per tile per round
tiles
  id, round_id, word, type ('red'|'blue'|'neutral'|'black'), revealed, revealed_by, revealed_at, marked

-- One row per clue given
clues
  id, round_id, team, word, count, given_by, given_at

-- Round results history
round_results
  id, room_id, round_number, winner_team, red_remaining, blue_remaining, ended_at
```

### What this fixes
- Tile reveal = `UPDATE tiles SET revealed=true WHERE id=X` — one row, atomic, no blob conflict possible
- Clue history lives in `clues` table — not re-broadcast on every event
- History never bloats the live state — query it separately when needed
- WordSpy gets the same benefit if it migrates too

### Audit agent — what to check
```
[ ] Does game_state table exist with a payload JSONB column?
[ ] Are tiles stored inside the payload blob?
[ ] Is clueHistory an array inside payload?
[ ] Is roundHistory an array inside payload?
[ ] Is player list stored inside payload?
```

### Audit agent — what to do if ❌
1. Write the migration SQL above as a new Supabase migration file
2. Create a `migratePayloadToSchema(roomId)` utility that reads the old blob and inserts into new tables
3. Update `getMFState` to query new tables and assemble the same GameState type the UI expects — UI changes are zero
4. Update `updateMFState` to write to individual tables instead of blob
5. **WordSpy:** Check if WordSpy uses the same `game_state` table and `payload` pattern. If yes — apply the same migration with a `game_type` discriminator column or separate tables prefixed `ws_`

---

## SECTION 2 — Polling (Bandwidth & DB Load)

### Problem
`useRoom.ts` polls `/state` every 2 seconds on every client. This fetches the entire payload JSONB on every poll regardless of whether anything changed.

### Why this hurts
- 6 players × 1 request per 2s = 3 full blob reads/sec hitting the DB constantly
- At 10–50KB per response = 30–150KB/sec of wasted bandwidth per game
- `getMFStateByCode()` does an INNER JOIN on `rooms.code` — no guaranteed index on this join — on every poll
- Polling runs even when Realtime is working fine

### Design decision — two-part fix

**Part A: ETag / 304 response**
Hash the `updated_at` timestamp. Client sends `If-None-Match: <hash>` header. Server returns `304 Not Modified` with empty body if nothing changed. Zero DB read, zero bandwidth on unchanged state.

**Part B: Fix Realtime reliability, make polling the true fallback only**
Supabase Realtime already pushes on every DB UPDATE. Polling exists as a fallback but `realtimeReady` never goes false on stale connections so the fallback never actually triggers — polling just always runs. Fix: track Realtime subscription status properly. Only poll when `status !== 'SUBSCRIBED'`.

### What this fixes
- Eliminates ~90% of polling requests during normal gameplay
- DB reads drop from 3/sec to near-zero between game events
- Bandwidth drops from constant to event-driven

### Audit agent — what to check
```
[ ] Does useRoom.ts have a setInterval polling /state?
[ ] What is the interval? (expected: 2000ms)
[ ] Does the /state GET route return ETag or Cache-Control headers?
[ ] Does the client send If-None-Match on poll requests?
[ ] Does realtimeReady ever get set to false on disconnect?
[ ] Is polling conditional on realtimeReady === false?
```

### Audit agent — what to do if ❌

**For ETag (do this first — lowest effort):**
```ts
// In /state GET route
const etag = `"${gameState.updatedAt.getTime()}"`;
if (req.headers.get('if-none-match') === etag) {
  return new Response(null, { status: 304 });
}
return NextResponse.json(gameState, {
  headers: { 'ETag': etag }
});

// In useRoom.ts polling
const lastEtag = useRef<string>('');
// Add If-None-Match header to fetch, skip setGameState on 304
```

**For Realtime fix:**
```ts
// Track subscription status
const [realtimeStatus, setRealtimeStatus] = useState<string>('CONNECTING');

channel.subscribe((status) => {
  setRealtimeStatus(status); // 'SUBSCRIBED' | 'CLOSED' | 'CHANNEL_ERROR'
});

// Only poll when not subscribed
useEffect(() => {
  if (realtimeStatus === 'SUBSCRIBED') return;
  const interval = setInterval(pollState, 2000);
  return () => clearInterval(interval);
}, [realtimeStatus]);
```

---

## SECTION 3 — Race Conditions

### Problem A — Tile reveal (P0 — game-breaking)
Two agents tap the same card at the same millisecond. Both read `revealed: false`. Both write `revealed: true`. Both decrement `guessesRemaining`. Score corrupted, turn ends twice.

### Problem B — Player join (P0 — player silently dropped)
Two players join at the same second. Both read the player list with N players. Both append themselves. Both write N+1 players. One player is dropped silently.

### Problem C — Lobby updates (P1)
Two players change team at the same time. Full state blob replace. Last write wins. One player's team change is lost.

### Design decision
**For tile reveal:** Server-side guard — reject if already revealed before writing. With the new schema this is automatic (unique constraint on `round_id + tile_id`). Without schema change: conditional UPDATE with a version check.

**For player join:** Atomic upsert using Supabase RPC (Postgres function). Not a read-modify-write in application code.

**For lobby updates:** Add a `version` integer to GameState. Server rejects writes where the submitted version doesn't match current version. Client retries with fresh state.

### What this fixes
- No more phantom turn endings from double-reveals
- No more silently dropped players on simultaneous joins
- No more lost team assignments in lobby

### Audit agent — what to check
```
[ ] In reveal/route.ts — is there a check for tile.revealed before writing?
[ ] Does updateMFStateIf() use a version/conditional UPDATE?
[ ] On CAS conflict in reveal — does code re-read from DB (N+1 problem)?
[ ] In rooms/route.ts join — is player append done with an RPC or raw read-modify-write?
[ ] Does GameState have a version field?
[ ] Does the PATCH /state route check version before writing?
```

### Audit agent — what to do if ❌

**Tile reveal guard (without schema change):**
```ts
// reveal/route.ts — after reading current state
const tile = state.tiles.find(t => t.id === tileId);
if (tile?.revealed) {
  return NextResponse.json({ error: 'already_revealed' }, { status: 409 });
}
```

**Tile reveal guard (with new schema):**
```sql
-- Add unique constraint — duplicate reveals are impossible at DB level
ALTER TABLE tiles ADD CONSTRAINT tiles_reveal_once
  CHECK (revealed = false OR revealed_at IS NOT NULL);
-- Use conditional UPDATE
UPDATE tiles SET revealed=true, revealed_at=now()
WHERE id=$1 AND revealed=false
RETURNING *;
-- If 0 rows returned → already revealed → return 409
```

**Atomic player join RPC:**
```sql
-- Create in Supabase SQL editor as a migration
CREATE OR REPLACE FUNCTION join_room(
  p_room_id uuid,
  p_player_name text,
  p_team text
) RETURNS void AS $$
BEGIN
  INSERT INTO room_players (room_id, player_name, team, role)
  VALUES (p_room_id, p_player_name, p_team, 'agent')
  ON CONFLICT (room_id, player_name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;
```

**Version field:**
```ts
// Add to GameState type
version: number; // increment on every write

// In PATCH /state route
if (incoming.version !== currentState.version) {
  return NextResponse.json({ error: 'version_conflict', current: currentState }, { status: 409 });
}
// Write with version + 1
```

---

## SECTION 4 — Realtime Architecture

### Problem
Realtime fires on DB row changes only. This means even ephemeral events (player hovering a card, typing a clue) require a full DB write to communicate to other players.

### Design decision — two Realtime channels

**Channel 1: DB listen (durable state)**
Keep the existing Supabase Realtime DB listener for state that must be persisted — tile reveals, clue submissions, round transitions, player joins.

**Channel 2: Broadcast (ephemeral events)**
Use Supabase Realtime Broadcast for events that don't need DB persistence — player is looking at a card, spymaster is typing, cursor positions. These fire instantly with no DB write.

```ts
// Ephemeral — no DB write
channel.send({
  type: 'broadcast',
  event: 'player_thinking',
  payload: { playerId, tileId }
});

// Durable — DB write triggers Realtime
await revealTile(tileId); // writes to DB → Realtime fires automatically
```

### What this fixes
- Removes DB writes for non-permanent actions
- Makes "player is thinking" indicators feel instant
- Spymaster typing indicator costs zero DB writes

### Audit agent — what to check
```
[ ] Is there a Supabase Broadcast channel set up anywhere in useRoom.ts?
[ ] Are any ephemeral events (hover, typing) currently writing to DB?
[ ] Is the Realtime channel using postgres_changes listener?
[ ] Is there any "player is thinking" or hover state shared across clients?
```

### Audit agent — what to do if ❌
1. Add a second channel in `useRoom.ts` for broadcast events
2. Move any hover/selection state off DB writes onto broadcast
3. Keep `postgres_changes` channel for durable state only
4. No backend changes needed — broadcast is client-to-client

---

## SECTION 5 — Word Fetch Performance

### Problem
`start/route.ts` and next-round handler call `getWords(packId)` which does `SELECT *` on the entire words table for a pack, fetches all columns, fetches all rows, every time a game starts or a new round begins. No caching. `getPacksWithWords` has an in-memory cache but isn't used here.

### Why this hurts
- 300 words × 6 columns = ~30KB fetched to pick 25 words
- Blocks game start — nothing happens until fetch completes
- `getWords` uses the browser Supabase client on the server — works but wrong

### Design decision
Use the existing `getPacksWithWords` cache. Change `SELECT *` to `SELECT word_a`. Cache the result in a module-level Map keyed by `packId`.

### What this fixes
- First game start: normal DB fetch
- Every subsequent start/round with same pack: instant from cache
- Payload over wire drops from ~30KB to ~3KB

### Audit agent — what to check
```
[ ] Does start/route.ts call getWords() directly?
[ ] Does getWords() use SELECT * or SELECT word_a?
[ ] Does start/route.ts use getPacksWithWords() instead?
[ ] Is there a module-level cache Map for word packs?
[ ] Does getWords use the browser supabase client on the server?
```

### Audit agent — what to do if ❌
```ts
// wordpacks.ts — change select
const { data } = await supabase
  .from('words')
  .select('word_a') // was: select('*')
  .eq('pack_id', packId);

// start/route.ts — use cache
const wordCache = new Map<string, string[]>(); // module level

async function getWordsForPack(packId: string): Promise<string[]> {
  if (wordCache.has(packId)) return wordCache.get(packId)!;
  const words = await getWords(packId);
  wordCache.set(packId, words);
  return words;
}
```

---

## SECTION 6 — State Machine (Game Logic)

### Problem
Game phase logic is scattered — parts in `engine.ts`, parts in route handlers, parts in the component. Phase transitions happen in multiple places. No single source of truth for what actions are legal in which phase.

### Design decision
One explicit state machine with named states and legal transitions. Every action validated against current phase before touching DB.

```
LOBBY
  → [host starts game] → ROUND_STARTING
ROUND_STARTING
  → [words assigned, teams set] → SPYMASTER_CLUE (red goes first)
SPYMASTER_CLUE
  → [clue submitted] → AGENTS_GUESSING
AGENTS_GUESSING
  → [correct guess, guesses remain] → AGENTS_GUESSING
  → [wrong guess OR pass OR guesses exhausted] → TURN_END
TURN_END
  → [all red or blue revealed] → ROUND_END
  → [black revealed] → GAME_OVER
  → [otherwise] → SPYMASTER_CLUE (other team)
ROUND_END
  → [winner reached target wins] → GAME_OVER
  → [otherwise] → ROUND_STARTING
GAME_OVER
  → [host starts new game] → LOBBY
```

### What this fixes
- Impossible to submit a clue during AGENTS_GUESSING phase
- Impossible to reveal a tile during SPYMASTER_CLUE phase
- Race conditions on phase transitions caught before DB write
- All phase logic in one file — easy to audit and change

### Audit agent — what to check
```
[ ] Is there a single transition() function or state machine in engine.ts?
[ ] Are phase checks done before DB writes in route handlers?
[ ] Can a clue be submitted when it's the agents' turn? (should be rejected)
[ ] Can a tile be revealed when it's the spymaster's turn? (should be rejected)
[ ] Are illegal transitions rejected with a clear error?
```

### Audit agent — what to do if ❌
```ts
// engine.ts — add transition validator
const LEGAL_ACTIONS: Record<Phase, Action[]> = {
  LOBBY: ['start_game', 'assign_team', 'assign_spymaster'],
  SPYMASTER_CLUE: ['submit_clue'],
  AGENTS_GUESSING: ['reveal_tile', 'mark_tile', 'pass'],
  TURN_END: [],
  ROUND_END: ['next_round'],
  GAME_OVER: ['new_game'],
};

export function validateAction(phase: Phase, action: Action): boolean {
  return LEGAL_ACTIONS[phase]?.includes(action) ?? false;
}

// In every route handler — first line after reading state:
if (!validateAction(state.phase, action)) {
  return NextResponse.json({ error: 'illegal_action', phase: state.phase }, { status: 400 });
}
```

---

## SECTION 7 — WordSpy Impact Assessment

WordSpy is the only other game with online rooms. Before running any migration:

### Audit agent — what to check for WordSpy
```
[ ] Does WordSpy use the same game_state table as MindField?
[ ] Does WordSpy use the same payload JSONB pattern?
[ ] Does WordSpy use getMFState / updateMFState or its own functions?
[ ] Does WordSpy have its own polling in useRoom or equivalent?
[ ] Does WordSpy have tile reveals or equivalent concurrent write operations?
```

### Decision tree
```
If WordSpy uses same game_state table:
  → Add game_type column ('mindfield' | 'wordspy')
  → Create separate normalized tables prefixed ws_ for WordSpy
  → Migrate WordSpy state separately, don't mix schemas

If WordSpy uses separate table:
  → MindField migration has zero impact on WordSpy
  → Apply same fixes to WordSpy independently after MindField is stable

If WordSpy shares utility functions (getMFState etc):
  → Extract shared room/player logic into /lib/rooms.ts
  → Game-specific state functions stay in /games/mindfield/ and /games/wordspy/
```

---

## Priority Order for the Audit Agent

| Priority | Section | Fix | Effort | Impact |
|---|---|---|---|---|
| P0 | §3 | Tile reveal guard — reject if already revealed | 5 lines | Prevents corrupted game state |
| P0 | §3 | Atomic player join RPC | 1 SQL function | Prevents silently dropped players |
| P1 | §2 | ETag on /state GET route | ~20 lines | Eliminates ~90% of wasted poll bandwidth |
| P1 | §2 | Realtime status tracking — poll only on disconnect | ~15 lines | Removes constant background DB reads |
| P1 | §5 | Word fetch — use cache + SELECT word_a | ~10 lines | Removes 300ms blocking delay on game start |
| P1 | §3 | Version field on GameState | ~30 lines | Prevents lost lobby changes |
| P2 | §4 | Add Broadcast channel for ephemeral events | ~40 lines | Instant feel for hover/typing indicators |
| P2 | §6 | State machine transition validator | ~30 lines | Prevents illegal actions in wrong phase |
| P3 | §1 | Full schema migration to normalized tables | Large | Permanent fix for all blob problems |
| P3 | §7 | WordSpy impact assessment and migration | Medium | Apply same fixes to WordSpy |

---

## What the audit agent should output after inspection

For each section above, produce a report in this format:

```
## Section N — [Name]
Status: ✅ / ⚠️ / ❌
Files inspected: [list]
Finding: [what the code actually does today]
Action: [none needed / specific changes required]
WordSpy affected: yes / no / unknown
```

Then implement fixes in priority order, P0 first.