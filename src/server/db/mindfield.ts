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

function normalizeState(row: MFStateRow): MFStateRow {
  if (row?.payload && row.payload.version === undefined) {
    row.payload = { ...row.payload, version: 0 };
  }
  return row;
}

export async function getMFState(roomId: string): Promise<MFStateRow | null> {
  const db = createServerClient();
  const { data, error } = await db
    .from("game_state")
    .select("*")
    .eq("room_id", roomId)
    .maybeSingle();
  if (error) throw new Error(`getMFState: ${error.message}`);
  return data ? normalizeState(data as MFStateRow) : null;
}

export async function getMFStateByCode(roomCode: string): Promise<MFStateRow | null> {
  const db = createServerClient();
  const { data, error } = await db
    .from("game_state")
    .select("*, rooms!inner(code)")
    .eq("rooms.code", roomCode)
    .maybeSingle();
  if (error) throw new Error(`getMFStateByCode: ${error.message}`);
  return data ? normalizeState(data as MFStateRow) : null;
}

// Unconditional update — bumps version in payload. Use for lobby/non-competitive writes.
export async function updateMFState(roomId: string, state: GameState): Promise<void> {
  const db = createServerClient();
  const newState = { ...state, version: (state.version ?? 0) + 1 };
  const { error } = await db
    .from("game_state")
    .update({ phase: newState.phase, round: newState.round, payload: newState })
    .eq("room_id", roomId);
  if (error) throw new Error(`updateMFState: ${error.message}`);
}

// Conditional update — only writes if the stored version matches state.version.
// On conflict, fetches current DB state (direct room_id lookup, no join) and returns it.
// Use for reveal, join, and any competitive read-modify-write.
export async function updateMFStateIf(
  roomId: string,
  state: GameState
): Promise<{ conflict: false; newState: GameState } | { conflict: true; currentRow: MFStateRow }> {
  const db = createServerClient();
  const currentVersion = state.version ?? 0;
  const newState = { ...state, version: currentVersion + 1 };

  const { data, error } = await db
    .from("game_state")
    .update({ phase: newState.phase, round: newState.round, payload: newState })
    .eq("room_id", roomId)
    .or(`payload->>version.eq.${currentVersion},payload->>version.is.null`)
    .select("id");

  if (error) throw new Error(`updateMFStateIf: ${error.message}`);

  if (!data || data.length === 0) {
    const currentRow = await getMFState(roomId);
    if (!currentRow) throw new Error(`updateMFStateIf: room ${roomId} vanished after conflict`);
    return { conflict: true, currentRow };
  }

  return { conflict: false, newState };
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
