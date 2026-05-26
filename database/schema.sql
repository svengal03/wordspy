-- ============================================================
-- PlayHub — Supabase Schema
-- Run this in the Supabase SQL editor (Dashboard → SQL)
-- Order matters for FK dependencies
-- ============================================================

-- Enable UUID extension (already enabled on Supabase)
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- 1. word_packs
-- ─────────────────────────────────────────────────────────────
create table if not exists word_packs (
  id          uuid primary key default gen_random_uuid(),
  game        text not null
  name        text not null,
  category    text not null,
  emoji       text,
  description text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists idx_word_packs_game
  on word_packs (game, is_active);

-- ─────────────────────────────────────────────────────────────
-- 2. words
-- ─────────────────────────────────────────────────────────────
create table if not exists words (
  id          uuid primary key default gen_random_uuid(),
  pack_id     uuid not null references word_packs (id) on delete cascade,
  word_a      text not null,
  word_b      text,             -- null for single-word games
  difficulty  int  not null default 2 check (difficulty between 1 and 3),
  created_at  timestamptz not null default now()
);

create index if not exists idx_words_pack_id
  on words (pack_id);

-- ─────────────────────────────────────────────────────────────
-- 3. room_players  (must exist before rooms.host_id FK)
-- ─────────────────────────────────────────────────────────────
create table if not exists room_players (
  id           uuid primary key default gen_random_uuid(),
  room_id      uuid not null,   -- FK added below after rooms exists
  player_name  text not null,
  is_host      boolean not null default false,
  role         text,            -- game-specific: 'spymaster'|'agent' | 'civilian'|'undercover'|'ghost' etc.
  team         text,                -- game-specific: MindField uses 'red'|'blue', others: null
  word         text,            -- WordSpy: secret word assigned to player, others: null
  score        int  not null default 0,
  is_connected boolean not null default true,
  joined_at    timestamptz not null default now(),
  unique (room_id, player_name)
);

-- ─────────────────────────────────────────────────────────────
-- 4. rooms  (host_id references room_players, added after)
-- ─────────────────────────────────────────────────────────────
create table if not exists rooms (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,
  game       text not null
  host_id    uuid,              -- FK to room_players.id, added below
  status     text not null default 'lobby'
               check (status in ('lobby','playing','ended')),
  settings   jsonb not null default '{}'::jsonb,
  pack_id    uuid references word_packs (id) on delete set null,
  expires_at timestamptz not null default (now() + interval '2 hours'),
  created_at timestamptz not null default now()
);

create index if not exists idx_rooms_code    on rooms (code);
create index if not exists idx_rooms_status  on rooms (status);
create index if not exists idx_rooms_expires on rooms (expires_at);

-- ─────────────────────────────────────────────────────────────
-- 5. room_players → rooms FK  (now rooms exists)
-- ─────────────────────────────────────────────────────────────
alter table room_players
  add constraint fk_room_players_room
    foreign key (room_id) references rooms (id) on delete cascade;

-- rooms → room_players (host_id) FK
alter table rooms
  add constraint fk_rooms_host
    foreign key (host_id) references room_players (id) on delete set null;

-- ─────────────────────────────────────────────────────────────
-- 6. game_state  (1:1 with rooms)
-- ─────────────────────────────────────────────────────────────
create table if not exists game_state (
  id             uuid primary key default gen_random_uuid(),
  room_id        uuid not null unique references rooms (id) on delete cascade,
  phase          text not null default 'lobby',
  round          int  not null default 0,
  turn_player_id uuid references room_players (id) on delete set null,
  payload        jsonb not null default '{}'::jsonb,
  updated_at     timestamptz not null default now()
);

create index if not exists idx_game_state_room_id
  on game_state (room_id);

-- auto-update updated_at on every write
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_game_state_updated_at on game_state;
create trigger trg_game_state_updated_at
  before update on game_state
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 7. game_events  (append-only event log)
-- ─────────────────────────────────────────────────────────────
create table if not exists game_events (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid not null references rooms (id) on delete cascade,
  player_id   uuid references room_players (id) on delete set null,
  event_type  text not null,
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- composite index for ordered event replay per room
create index if not exists idx_game_events_room_time
  on game_events (room_id, created_at);

-- ─────────────────────────────────────────────────────────────
-- 8. MindField normalized tables
-- ─────────────────────────────────────────────────────────────
create table if not exists mf_rounds (
  id                  uuid primary key default gen_random_uuid(),
  room_id             uuid not null references rooms(id) on delete cascade,
  round_number        int not null,
  current_team        text not null default 'red',
  turn_phase          text not null default 'giving-clue',
  clue                text,
  clue_number         int,
  guesses_remaining   int not null default 0,
  big_clue_used_red   boolean not null default false,
  big_clue_used_blue  boolean not null default false,
  round_winner        text,
  bomb_triggered_by   text,
  started_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (room_id, round_number)
);

create index if not exists idx_mf_rounds_room_id on mf_rounds (room_id);

create table if not exists mf_tiles (
  id          uuid primary key default gen_random_uuid(),
  round_id    uuid not null references mf_rounds(id) on delete cascade,
  position    int not null,
  word        text not null,
  color       text not null,
  revealed    boolean not null default false,
  revealed_at timestamptz,
  flagged     boolean not null default false,
  unique (round_id, position)
);

create index if not exists idx_mf_tiles_round_id on mf_tiles (round_id);

create table if not exists mf_clues (
  id             uuid primary key default gen_random_uuid(),
  round_id       uuid not null references mf_rounds(id) on delete cascade,
  sequence       int not null,
  team           text not null,
  spymaster_name text not null default '',
  word           text not null,
  count          int not null,
  given_at       timestamptz not null default now(),
  unique (round_id, sequence)
);

create table if not exists mf_round_results (
  id                   uuid primary key default gen_random_uuid(),
  room_id              uuid not null references rooms(id) on delete cascade,
  round_number         int not null,
  winner               text not null,
  bomb_triggered       boolean not null default false,
  bomb_triggered_by    text,
  winner_used_big_clue boolean not null default false,
  red_points_earned    int not null default 0,
  blue_points_earned   int not null default 0,
  ended_at             timestamptz not null default now(),
  unique (room_id, round_number)
);
