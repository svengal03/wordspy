import { NextRequest, NextResponse } from "next/server";
import { getMFMetaByCode, getMFStateByCode, getMFState, getMFMeta, updateMFState } from "@/server/db/mindfield";
import type { GameState } from "@/games/mindfield/types";

export const runtime = "edge";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomCode } = await params;

  // Cheap check first — 2 queries instead of 8+ for 304 responses
  const meta = await getMFMetaByCode(roomCode);
  if (!meta) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const etag = `"${meta.updated_at}"`;
  if (req.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304, headers: { ETag: etag } });
  }

  const row = await getMFState(meta.room_id);
  if (!row) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  return NextResponse.json(
    { gameState: row.state, roomId: row.room_id },
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

  const meta = await getMFMeta(roomId);
  if (!meta) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  // Version check only matters for in-game state (tile reveals etc) — and reveals have their own
  // atomic protection. Lobby/round-over actions (team, role, pack, target wins) are commutative;
  // enforcing a strict version match here causes spurious conflicts under realtime echo races.
  if (meta.phase === "playing") {
    const currentVersion = new Date(meta.updated_at).getTime();
    if (body.gameState.version > 0 && body.gameState.version !== currentVersion) {
      const fresh = await getMFState(roomId);
      return NextResponse.json({ error: "version_conflict", current: fresh?.state }, { status: 409 });
    }
  }

  if (
    (meta.phase === "lobby" && body.gameState.phase === "playing") ||
    (meta.phase === "round-over" && body.gameState.phase === "playing")
  ) {
    return NextResponse.json({ error: "illegal_action", phase: meta.phase }, { status: 400 });
  }

  await updateMFState(roomId, body.gameState);

  const fresh = await getMFState(roomId);
  return NextResponse.json({ ok: true, gameState: fresh?.state });
}
