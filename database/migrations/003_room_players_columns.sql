-- ============================================================
-- Migration 003 — room_players: team, word, unique constraint
-- Run in Supabase SQL editor AFTER 002_mindfield.sql
-- Safe to re-run (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)
-- ============================================================

begin;

-- team: MindField uses 'red'|'blue', WordSpy leaves null — no check constraint so new games can use any team names
alter table room_players
  add column if not exists team text;

-- word: WordSpy assigns a secret word per player, MindField leaves null
alter table room_players
  add column if not exists word text;

-- Unique player name per room — required for atomic upsert (ON CONFLICT DO NOTHING)
alter table room_players
  drop constraint if exists room_players_room_id_player_name_key;
alter table room_players
  add constraint room_players_room_id_player_name_key
    unique (room_id, player_name);

commit;
