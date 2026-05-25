import { NextRequest, NextResponse } from "next/server";
import { getMFStateByCode, updateMFStateIf } from "@/server/db/mindfield";
import { revealTile } from "@/games/mindfield/engine";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let body: { tileId: number };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const { id: roomCode } = await params;
  const row = await getMFStateByCode(roomCode);
  if (!row) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const state = row.payload;

  if (state.phase !== "playing" || state.turnPhase !== "guessing") {
    return NextResponse.json({ error: "Not in guessing phase" }, { status: 409 });
  }

  const tile = state.tiles.find(t => t.id === body.tileId);
  if (!tile || tile.revealed) {
    return NextResponse.json({ error: "Tile already revealed or not found" }, { status: 409 });
  }

  const newState = revealTile(state, body.tileId);
  const result = await updateMFStateIf(row.room_id, newState);

  if (result.conflict) {
    return NextResponse.json({ gameState: result.currentRow.payload, conflict: true }, { status: 409 });
  }

  return NextResponse.json({ gameState: result.newState });
}
