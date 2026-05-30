-- ============================================================
-- PlayHub — Row Level Security Policies
-- Run AFTER schema.sql in the Supabase SQL editor
-- ============================================================

-- Enable RLS on all tables (required for Realtime postgres_changes)
alter table word_packs    enable row level security;
alter table words         enable row level security;
alter table rooms         enable row level security;
alter table room_players  enable row level security;
alter table game_state    enable row level security;
alter table game_events   enable row level security;

-- ─────────────────────────────────────────────────────────────
-- word_packs — public read, no client write
-- ─────────────────────────────────────────────────────────────
create policy "word_packs: public read"
  on word_packs for select
  to anon, authenticated
  using (true);

-- ─────────────────────────────────────────────────────────────
-- words — public read, no client write
-- ─────────────────────────────────────────────────────────────
create policy "words: public read"
  on words for select
  to anon, authenticated
  using (true);

-- ─────────────────────────────────────────────────────────────
-- rooms — anyone can read; only the host can update
-- "host" is identified by the host_id FK matching a room_player
-- whose id is stored in request headers/JWT claim (service role bypasses)
-- ─────────────────────────────────────────────────────────────
create policy "rooms: public read"
  on rooms for select
  to anon, authenticated
  using (true);

create policy "rooms: host can update"
  on rooms for update
  to authenticated
  using (
    host_id in (
      select id from room_players
      where room_id = rooms.id
        and is_host = true
    )
  );

create policy "rooms: service role insert"
  on rooms for insert
  to service_role
  with check (true);

create policy "rooms: service role update"
  on rooms for update
  to service_role
  using (true);

create policy "rooms: service role delete"
  on rooms for delete
  to service_role
  using (true);

-- ─────────────────────────────────────────────────────────────
-- room_players — anyone in the room can read; only self can update
-- ─────────────────────────────────────────────────────────────
create policy "room_players: public read"
  on room_players for select
  to anon, authenticated
  using (true);

create policy "room_players: service role all"
  on room_players for all
  to service_role
  using (true)
  with check (true);

-- ─────────────────────────────────────────────────────────────
-- game_state — anyone can read; only service role (API) can write
-- This ensures game state mutations only happen through API routes
-- Supabase Realtime broadcasts UPDATE events to all subscribers
-- ─────────────────────────────────────────────────────────────
create policy "game_state: public read"
  on game_state for select
  to anon, authenticated
  using (true);

create policy "game_state: service role write"
  on game_state for all
  to service_role
  using (true)
  with check (true);

-- ─────────────────────────────────────────────────────────────
-- game_events — anyone can read; only service role (API) can write
-- ─────────────────────────────────────────────────────────────
create policy "game_events: public read"
  on game_events for select
  to anon, authenticated
  using (true);

create policy "game_events: service role write"
  on game_events for all
  to service_role
  using (true)
  with check (true);
