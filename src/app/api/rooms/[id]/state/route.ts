import { NextRequest, NextResponse } from "next/server";
import { getRoom } from "@/server/db/rooms";
import { getState, updateState } from "@/server/db/gamestate";
import type { GameState } from "@/games/wordspy/types";

// GET /wordspy/api/rooms/[id]/state
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomCode } = await params;
  const room = await getRoom(roomCode);
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const row = await getState(room.id);
  if (!row) {
    return NextResponse.json({ error: "Game state not found" }, { status: 404 });
  }

  return NextResponse.json({ gameState: row.payload, roomId: room.id });
}

// PATCH /wordspy/api/rooms/[id]/state
// Body: { gameState: GameState }
// Supabase Realtime will automatically broadcast the postgres_changes UPDATE
// to all subscribers — no manual push needed.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let body: { gameState: GameState };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { id: roomCode } = await params;
  const room = await getRoom(roomCode);
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  await updateState(room.id, body.gameState);
  return NextResponse.json({ ok: true });
}
