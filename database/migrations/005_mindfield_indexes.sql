-- ============================================================
-- Migration 005 — MindField hot-path indexes
-- Run in Supabase SQL editor AFTER 004_mindfield_normalize.sql
-- Safe to re-run (IF NOT EXISTS)
-- ============================================================

begin;

-- mf_clues are read by round_id (ORDER BY sequence) on every state assembly
create index if not exists idx_mf_clues_round_id on mf_clues (round_id);

-- mf_round_results are read by room_id on every state assembly
create index if not exists idx_mf_round_results_room_id on mf_round_results (room_id);

-- room_players are read by room_id on every state assembly (FK index)
create index if not exists idx_room_players_room_id on room_players (room_id);

-- game_state is read by room_id on every meta/state lookup
create index if not exists idx_game_state_room_id on game_state (room_id);

-- rooms is read by code on join/state-by-code paths
create index if not exists idx_rooms_code on rooms (code);

commit;
