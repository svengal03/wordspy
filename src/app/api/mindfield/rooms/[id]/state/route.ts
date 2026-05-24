import { NextRequest, NextResponse } from "next/server";
import { getRoom } from "@/server/db/rooms";
import { getMFState, updateMFState } from "@/server/db/mindfield";
import type { GameState } from "@/games/mindfield/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomCode } = await params;
  const room = await getRoom(roomCode);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const row = await getMFState(room.id);
  if (!row) return NextResponse.json({ error: "State not found" }, { status: 404 });

  return NextResponse.json({ gameState: row.payload, roomId: room.id });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let body: { gameState: GameState };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const { id: roomCode } = await params;
  const room = await getRoom(roomCode);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  await updateMFState(room.id, body.gameState);
  return NextResponse.json({ ok: true });
}
