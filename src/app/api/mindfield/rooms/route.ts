import { NextRequest, NextResponse } from "next/server";
import { generateRoomCode, createInitialState } from "@/games/mindfield/engine";
import { DEFAULT_CONFIG } from "@/games/mindfield/types";
import type { Player } from "@/games/mindfield/types";
import { createRoom, getRoom } from "@/server/db/rooms";
import { insertMFState, getMFStateByCode, updateMFState } from "@/server/db/mindfield";

export async function POST(req: NextRequest) {
  let body: { action: string; roomCode?: string; playerData?: Player };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const { action, roomCode } = body;

  // ── create ────────────────────────────────────────────────────────────────
  if (action === "create") {
    const code = generateRoomCode();
    const state = createInitialState(code, DEFAULT_CONFIG);
    const room = await createRoom(code, "mindfield", DEFAULT_CONFIG as unknown as Record<string, unknown>);
    await insertMFState(room.id, state);
    return NextResponse.json({ roomCode: code, gameState: state });
  }

  // ── get ───────────────────────────────────────────────────────────────────
  if (action === "get") {
    if (!roomCode) return NextResponse.json({ error: "roomCode required" }, { status: 400 });
    const row = await getMFStateByCode(roomCode);
    if (!row) return NextResponse.json({ error: "Room not found" }, { status: 404 });
    return NextResponse.json({ gameState: row.payload });
  }

  // ── join ──────────────────────────────────────────────────────────────────
  // Atomic: read current players, add if not present, write back.
  // Prevents race condition where two simultaneous joins overwrite each other.
  if (action === "join") {
    if (!roomCode) return NextResponse.json({ error: "roomCode required" }, { status: 400 });
    if (!body.playerData) return NextResponse.json({ error: "playerData required" }, { status: 400 });

    const row = await getMFStateByCode(roomCode);
    if (!row) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    const state = row.payload;

    if (state.phase !== "lobby") {
      return NextResponse.json({ error: "Game already in progress" }, { status: 409 });
    }

    // Already present by ID — no-op, return current player from DB
    const byId = state.players.find(p => p.id === body.playerData!.id);
    if (byId) {
      return NextResponse.json({ gameState: state, player: byId });
    }

    // Name collision — return the existing player so client adopts their ID/role
    const byName = state.players.find(
      p => p.name.toLowerCase() === body.playerData!.name.toLowerCase()
    );
    if (byName) {
      return NextResponse.json({ gameState: state, player: byName });
    }

    // New player — add atomically
    const room = await getRoom(roomCode);
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    const updated = { ...state, players: [...state.players, body.playerData] };
    await updateMFState(room.id, updated);
    return NextResponse.json({ gameState: updated, player: body.playerData });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
