import { NextRequest, NextResponse } from "next/server";
import { generateRoomCode } from "@/games/mindfield/engine";
import { DEFAULT_CONFIG } from "@/games/mindfield/types";
import type { Player } from "@/games/mindfield/types";
import { createRoom } from "@/server/db/rooms";
import { insertMFState, getMFStateByCode, getMFState } from "@/server/db/mindfield";
import { createServerClient } from "@/server/supabase";

export async function POST(req: NextRequest) {
  let body: { action: string; roomCode?: string; playerData?: Pick<Player, "name" | "isHost"> };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const { action, roomCode } = body;

  // ── create ────────────────────────────────────────────────────────────────
  if (action === "create") {
    const code = generateRoomCode();
    const room = await createRoom(code, "mindfield", DEFAULT_CONFIG as unknown as Record<string, unknown>);
    await insertMFState(room.id);
    return NextResponse.json({ roomCode: code, roomId: room.id });
  }

  // ── get ───────────────────────────────────────────────────────────────────
  if (action === "get") {
    if (!roomCode) return NextResponse.json({ error: "roomCode required" }, { status: 400 });
    const row = await getMFStateByCode(roomCode);
    if (!row) return NextResponse.json({ error: "Room not found" }, { status: 404 });
    return NextResponse.json({ gameState: row.state });
  }

  // ── join ──────────────────────────────────────────────────────────────────
  if (action === "join") {
    if (!roomCode) return NextResponse.json({ error: "roomCode required" }, { status: 400 });
    if (!body.playerData) return NextResponse.json({ error: "playerData required" }, { status: 400 });

    const db = createServerClient();
    const roomRes = await db.from("rooms").select("id").eq("code", roomCode).maybeSingle();
    if (!roomRes.data) return NextResponse.json({ error: "Room not found" }, { status: 404 });
    const roomId = roomRes.data.id as string;

    const row = await getMFState(roomId);
    if (!row) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    if (row.state.phase !== "lobby") {
      // Allow reconnect if player was already in this game
      const { data: existing } = await db
        .from("room_players")
        .select("id, team, role, is_host, joined_at")
        .eq("room_id", roomId)
        .eq("player_name", body.playerData.name)
        .maybeSingle();

      if (!existing) {
        return NextResponse.json({ error: "Game already in progress" }, { status: 409 });
      }

      // Reconnect — preserve team/role, just mark connected
      await db.from("room_players").update({ is_connected: true }).eq("id", existing.id);

      const player: Player = {
        id:       existing.id,
        name:     body.playerData.name,
        team:     existing.team ?? null,
        role:     existing.role ?? null,
        isHost:   existing.is_host,
        joinedAt: new Date(existing.joined_at).getTime(),
      };

      const fresh = await getMFState(roomId);
      return NextResponse.json({ gameState: fresh!.state, player, roomId });
    }

    // Atomic upsert — ON CONFLICT (room_id, player_name) updates is_host, is_connected
    const { data: playerRow, error: joinErr } = await db
      .from("room_players")
      .upsert(
        {
          room_id:     roomId,
          player_name: body.playerData.name,
          is_host:     body.playerData.isHost ?? false,
          is_connected: true,
          team:        null,
          role:        null,
        },
        { onConflict: "room_id,player_name" }
      )
      .select()
      .single();

    if (joinErr) return NextResponse.json({ error: joinErr.message }, { status: 500 });

    const player: Player = {
      id:       playerRow.id,
      name:     playerRow.player_name,
      team:     playerRow.team ?? null,
      role:     playerRow.role ?? null,
      isHost:   playerRow.is_host,
      joinedAt: new Date(playerRow.joined_at).getTime(),
    };

    // Touch game_state so Realtime notifies other devices of the new player
    await db.from("game_state").update({ phase: "lobby" }).eq("room_id", roomId);

    // Re-fetch assembled state so the response includes the new player
    const fresh = await getMFState(roomId);
    return NextResponse.json({ gameState: fresh!.state, player, roomId });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
