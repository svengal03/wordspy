import { NextRequest, NextResponse } from "next/server";
import { getRoom } from "@/server/db/rooms";
import { getMFState, updateMFState } from "@/server/db/mindfield";
import { revealTile } from "@/games/mindfield/engine";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let body: { tileId: number };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const { id: roomCode } = await params;
  const room = await getRoom(roomCode);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const row = await getMFState(room.id);
  if (!row) return NextResponse.json({ error: "State not found" }, { status: 404 });

  const state = row.payload;

  // Guard: only valid during guessing phase
  if (state.phase !== "playing" || state.turnPhase !== "guessing") {
    return NextResponse.json({ error: "Not in guessing phase" }, { status: 409 });
  }

  const tile = state.tiles.find(t => t.id === body.tileId);
  if (!tile || tile.revealed) {
    return NextResponse.json({ error: "Tile already revealed or not found" }, { status: 409 });
  }

  const newState = revealTile(state, body.tileId);
  await updateMFState(room.id, newState);

  return NextResponse.json({ gameState: newState });
}
