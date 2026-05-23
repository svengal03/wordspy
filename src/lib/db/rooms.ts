import { createServerClient } from "../supabase";
import type { GameState } from "../../app/wordspy/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface RoomRow {
  id: string;
  code: string;
  game: string;
  host_id: string | null;
  status: "lobby" | "playing" | "ended";
  settings: Record<string, unknown>;
  pack_id: string | null;
  expires_at: string;
  created_at: string;
}

// ─── createRoom ───────────────────────────────────────────────────────────────
export async function createRoom(
  code: string,
  game: string,
  settings: Record<string, unknown> = {},
  packId?: string
): Promise<RoomRow> {
  const db = createServerClient();
  const { data, error } = await db
    .from("rooms")
    .insert({
      code,
      game,
      settings,
      pack_id: packId ?? null,
      status: "lobby",
    })
    .select()
    .single();

  if (error) throw new Error(`createRoom: ${error.message}`);
  return data as RoomRow;
}

// ─── getRoom ──────────────────────────────────────────────────────────────────
export async function getRoom(code: string): Promise<RoomRow | null> {
  const db = createServerClient();
  const { data, error } = await db
    .from("rooms")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (error) throw new Error(`getRoom: ${error.message}`);
  return data as RoomRow | null;
}

// ─── updateRoom ───────────────────────────────────────────────────────────────
export async function updateRoom(
  id: string,
  patch: Partial<Pick<RoomRow, "status" | "host_id" | "pack_id" | "settings">>
): Promise<void> {
  const db = createServerClient();
  const { error } = await db.from("rooms").update(patch).eq("id", id);
  if (error) throw new Error(`updateRoom: ${error.message}`);
}

// ─── insertGameState ─────────────────────────────────────────────────────────
// Called once when a room is created to create the 1:1 game_state row.
export async function insertGameState(
  roomId: string,
  initialState: GameState
): Promise<void> {
  const db = createServerClient();
  const { error } = await db.from("game_state").insert({
    room_id: roomId,
    phase: initialState.phase,
    round: initialState.round,
    payload: initialState,
  });
  if (error) throw new Error(`insertGameState: ${error.message}`);
}
