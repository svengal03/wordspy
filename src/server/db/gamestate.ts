import { createServerClient } from "../supabase";
import type { GameState } from "@/games/wordspy/types";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface GameStateRow {
  id: string;
  room_id: string;
  phase: string;
  round: number;
  turn_player_id: string | null;
  payload: GameState;
  updated_at: string;
}

// ─── getState ─────────────────────────────────────────────────────────────────
export async function getState(roomId: string): Promise<GameStateRow | null> {
  const db = createServerClient();
  const { data, error } = await db
    .from("game_state")
    .select("*")
    .eq("room_id", roomId)
    .maybeSingle();

  if (error) throw new Error(`getState: ${error.message}`);
  return data as GameStateRow | null;
}

// ─── updateState ──────────────────────────────────────────────────────────────
// Writes the full GameState into the payload JSONB column and syncs the denormalised
// phase/round columns. Supabase Realtime will broadcast the UPDATE to all subscribers.
export async function updateState(
  roomId: string,
  state: GameState
): Promise<void> {
  const db = createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (db.from("game_state") as any)
    .update({ phase: state.phase, round: state.round, payload: state })
    .eq("room_id", roomId);

  if (error) throw new Error(`updateState: ${error.message}`);
}

// ─── getStateByCode ───────────────────────────────────────────────────────────
// Convenience: look up via room code (joins rooms → game_state).
export async function getStateByCode(roomCode: string): Promise<GameStateRow | null> {
  const db = createServerClient();
  const { data, error } = await db
    .from("game_state")
    .select("*, rooms!inner(code)")
    .eq("rooms.code", roomCode)
    .maybeSingle();

  if (error) throw new Error(`getStateByCode: ${error.message}`);
  return data as GameStateRow | null;
}
