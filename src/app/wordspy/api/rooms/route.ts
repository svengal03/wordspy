import { NextRequest, NextResponse } from "next/server";
import { generateRoomCode, createInitialGameState, castVote } from "../../lib/gameEngine";
import { DEFAULT_CONFIG } from "../../lib/types";
import { createRoom, getRoom, insertGameState } from "@/lib/db/rooms";
import { updateState, getStateByCode } from "@/lib/db/gamestate";

// ─── POST /wordspy/api/rooms ──────────────────────────────────────────────────
// Actions: create | get | update | remove-player | cast-vote
export async function POST(req: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { action, roomCode, gameState } = body;

  // ── create ──────────────────────────────────────────────────────────────────
  if (action === "create") {
    const code = generateRoomCode();
    const state = createInitialGameState(code, DEFAULT_CONFIG);
    const room = await createRoom(code, "wordspy", DEFAULT_CONFIG as unknown as Record<string, unknown>);
    await insertGameState(room.id, state);
    return NextResponse.json({ roomCode: code, gameState: state });
  }

  // ── get ─────────────────────────────────────────────────────────────────────
  if (action === "get") {
    const row = await getStateByCode(roomCode);
    if (!row) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    return NextResponse.json({ gameState: row.payload });
  }

  // ── update ──────────────────────────────────────────────────────────────────
  if (action === "update") {
    const room = await getRoom(roomCode);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    await updateState(room.id, gameState);
    return NextResponse.json({ ok: true });
  }

  // ── remove-player ────────────────────────────────────────────────────────────
  if (action === "remove-player") {
    const row = await getStateByCode(roomCode);
    if (!row) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    const { playerId } = body;
    const state = row.payload;
    const removedPlayer = state.players.find((p) => p.id === playerId);
    let remaining = state.players.filter((p) => p.id !== playerId);
    if (removedPlayer?.isHost && remaining.length > 0) {
      remaining = remaining.map((p, i) => (i === 0 ? { ...p, isHost: true } : p));
    }
    const updated = { ...state, players: remaining };
    const room = await getRoom(roomCode);
    if (room) await updateState(room.id, updated);
    return NextResponse.json({ gameState: updated });
  }

  // ── cast-vote (atomic server-side) ──────────────────────────────────────────
  if (action === "cast-vote") {
    const row = await getStateByCode(roomCode);
    if (!row) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    const { voterId, targetId } = body;
    const state = row.payload;
    const voter = state.players.find((p) => p.id === voterId);
    if (voter?.hasVoted) {
      return NextResponse.json({ gameState: state }); // idempotent
    }
    const updated = castVote(state, voterId, targetId, false);
    const room = await getRoom(roomCode);
    if (room) await updateState(room.id, updated);
    return NextResponse.json({ gameState: updated });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
