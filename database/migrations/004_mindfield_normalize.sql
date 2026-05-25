-- ============================================================
-- Migration 004 — MindField normalized tables
-- Run in Supabase SQL editor AFTER 003_room_players_columns.sql
-- ============================================================

begin;

-- mf_rounds: one row per round per room
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

-- mf_tiles: one row per tile per round (25 tiles per round)
create table if not exists mf_tiles (
  id          uuid primary key default gen_random_uuid(),
  round_id    uuid not null references mf_rounds(id) on delete cascade,
  position    int not null,           -- 0-24
  word        text not null,
  color       text not null,          -- 'red'|'blue'|'neutral'|'bomb'
  revealed    boolean not null default false,
  revealed_at timestamptz,
  flagged     boolean not null default false,
  unique (round_id, position)
);

create index if not exists idx_mf_tiles_round_id on mf_tiles (round_id);

-- mf_clues: one row per clue submitted
create table if not exists mf_clues (
  id             uuid primary key default gen_random_uuid(),
  round_id       uuid not null references mf_rounds(id) on delete cascade,
  sequence       int not null,        -- 0-indexed order within the round
  team           text not null,
  spymaster_name text not null default '',
  word           text not null,
  count          int not null,
  given_at       timestamptz not null default now(),
  unique (round_id, sequence)
);

-- mf_round_results: history of completed rounds
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

-- ── Trigger: bump game_state.updated_at when mf_* tables change ──────────────
-- This keeps Realtime and ETag working with no client changes

create or replace function mf_bump_room_updated_at()
returns trigger language plpgsql as $$
declare
  v_room_id uuid;
begin
  if tg_table_name = 'mf_tiles' then
    select room_id into v_room_id from mf_rounds where id = new.round_id;
  else
    v_room_id := new.room_id;
  end if;
  update game_state set updated_at = now() where room_id = v_room_id;
  return new;
end;
$$;

drop trigger if exists trg_mf_tiles_bump on mf_tiles;
create trigger trg_mf_tiles_bump
  after insert or update on mf_tiles
  for each row execute function mf_bump_room_updated_at();

drop trigger if exists trg_mf_rounds_bump on mf_rounds;
create trigger trg_mf_rounds_bump
  after insert or update on mf_rounds
  for each row execute function mf_bump_room_updated_at();

drop trigger if exists trg_mf_round_results_bump on mf_round_results;
create trigger trg_mf_round_results_bump
  after insert on mf_round_results
  for each row execute function mf_bump_room_updated_at();

commit;
