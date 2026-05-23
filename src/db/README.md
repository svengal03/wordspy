# PlayHub — Supabase Database

## Setup order

Run these in the Supabase SQL editor (**Dashboard → SQL Editor → New query**):

```
1. schema.sql   — creates all tables, indexes, triggers
2. rls.sql      — enables Row Level Security + policies
3. seed.sql     — inserts all word packs and words
```

## Regenerating seed.sql

The seed is auto-generated from the shared `WORD_PACKS` constant in `packages/core/src/wordPacks.ts`.

```bash
# From repo root
npx tsx src/db/generateSeed.ts > src/db/seed.sql
```

Re-run whenever you add or edit word packs in `wordPacks.ts`.

## Tables

| Table          | Purpose                                        |
|----------------|------------------------------------------------|
| `word_packs`   | Pack metadata per game (name, emoji, category) |
| `words`        | Word pairs belonging to a pack                 |
| `rooms`        | Active game rooms with 6-char join code        |
| `room_players` | Players in a room (persisted for rejoin)       |
| `game_state`   | Full game state JSONB — 1:1 with rooms         |
| `game_events`  | Append-only event log (optional analytics)     |

## Realtime

`game_state` has an `updated_at` trigger. Supabase Realtime broadcasts `UPDATE`
events on this table to all subscribers. The frontend hook `useSupabaseRoom`
(in `src/app/wordspy/lib/useSupabaseRoom.ts`) listens for these and calls
`setGameState` automatically — no manual Pusher-style pub/sub needed.

## Environment variables

| Variable                       | Where used             |
|-------------------------------|------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`    | Browser + server       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser (RLS applies) |
| `SUPABASE_SERVICE_ROLE_KEY`   | Server API routes only |
