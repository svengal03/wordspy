import { createServerClient } from "../supabase";
import type { GameState } from "@/games/mindfield/types";

export interface MFStateRow {
  id: string;
  room_id: string;
  phase: string;
  round: number;
  payload: GameState;
  updated_at: string;
}

export async function getMFState(roomId: string): Promise<MFStateRow | null> {
  const db = createServerClient();
  const { data, error } = await db
    .from("game_state")
    .select("*")
    .eq("room_id", roomId)
    .maybeSingle();
  if (error) throw new Error(`getMFState: ${error.message}`);
  return data as MFStateRow | null;
}

export async function getMFStateByCode(roomCode: string): Promise<MFStateRow | null> {
  const db = createServerClient();
  const { data, error } = await db
    .from("game_state")
    .select("*, rooms!inner(code)")
    .eq("rooms.code", roomCode)
    .maybeSingle();
  if (error) throw new Error(`getMFStateByCode: ${error.message}`);
  return data as MFStateRow | null;
}

export async function updateMFState(roomId: string, state: GameState): Promise<void> {
  const db = createServerClient();
  const { error } = await db
    .from("game_state")
    .update({ phase: state.phase, round: state.round, payload: state })
    .eq("room_id", roomId);
  if (error) throw new Error(`updateMFState: ${error.message}`);
}

export async function insertMFState(roomId: string, state: GameState): Promise<void> {
  const db = createServerClient();
  const { error } = await db.from("game_state").insert({
    room_id: roomId,
    phase: state.phase,
    round: state.round,
    payload: state,
  });
  if (error) throw new Error(`insertMFState: ${error.message}`);
}
