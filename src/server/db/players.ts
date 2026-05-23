import { createServerClient } from "../supabase";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface PlayerRow {
  id: string;
  room_id: string;
  player_name: string;
  is_host: boolean;
  role: string | null;
  score: number;
  is_connected: boolean;
  joined_at: string;
}

// ─── joinRoom ─────────────────────────────────────────────────────────────────
export async function joinRoom(
  roomId: string,
  playerName: string,
  isHost = false
): Promise<PlayerRow> {
  const db = createServerClient();
  const { data, error } = await db
    .from("room_players")
    .insert({ room_id: roomId, player_name: playerName, is_host: isHost })
    .select()
    .single();

  if (error) throw new Error(`joinRoom: ${error.message}`);
  return data as PlayerRow;
}

// ─── leaveRoom ────────────────────────────────────────────────────────────────
// Marks the player as disconnected rather than deleting so the row persists for
// rejoin / game history purposes.
export async function leaveRoom(playerId: string): Promise<void> {
  const db = createServerClient();
  const { error } = await db
    .from("room_players")
    .update({ is_connected: false })
    .eq("id", playerId);

  if (error) throw new Error(`leaveRoom: ${error.message}`);
}

// ─── updatePlayer ─────────────────────────────────────────────────────────────
export async function updatePlayer(
  playerId: string,
  patch: Partial<Pick<PlayerRow, "role" | "score" | "is_connected" | "is_host">>
): Promise<void> {
  const db = createServerClient();
  const { error } = await db
    .from("room_players")
    .update(patch)
    .eq("id", playerId);

  if (error) throw new Error(`updatePlayer: ${error.message}`);
}

// ─── getPlayers ───────────────────────────────────────────────────────────────
export async function getPlayers(roomId: string): Promise<PlayerRow[]> {
  const db = createServerClient();
  const { data, error } = await db
    .from("room_players")
    .select("*")
    .eq("room_id", roomId)
    .order("joined_at");

  if (error) throw new Error(`getPlayers: ${error.message}`);
  return (data ?? []) as PlayerRow[];
}
