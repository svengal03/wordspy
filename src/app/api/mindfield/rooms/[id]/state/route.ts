import { NextRequest, NextResponse } from "next/server";
import { getMFStateByCode, updateMFState } from "@/server/db/mindfield";
import type { GameState } from "@/games/mindfield/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomCode } = await params;
  const row = await getMFStateByCode(roomCode);
  if (!row) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const etag = `"${row.updated_at}"`;
  if (req.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304, headers: { ETag: etag } });
  }

  return NextResponse.json(
    { gameState: row.payload, roomId: row.room_id },
    { headers: { ETag: etag } }
  );
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let body: { gameState: GameState; roomId?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const { id: roomCode } = await params;

  let roomId = body.roomId;
  if (!roomId) {
    const row = await getMFStateByCode(roomCode);
    if (!row) return NextResponse.json({ error: "Room not found" }, { status: 404 });
    roomId = row.room_id;
  }

  await updateMFState(roomId, body.gameState);
  return NextResponse.json({ ok: true });
}
