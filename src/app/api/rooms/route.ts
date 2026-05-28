import { NextRequest, NextResponse } from "next/server";
import { generateRoomCode, createInitialGameState, castVote } from "@/games/wordspy/engine";
import { DEFAULT_CONFIG } from "@/games/wordspy/types";
import { createRoom, getRoom, insertGameState } from "@/server/db/rooms";
import { updateState, getStateByCode } from "@/server/db/gamestate";

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
      const newHostIdx = remaining.findIndex((p) => !p.isEliminated);
      const idx = newHostIdx >= 0 ? newHostIdx : 0;
      remaining = remaining.map((p, i) => (i === idx ? { ...p, isHost: true } : p));
    }
    const updated = { ...state, players: remaining };
    await updateState(row.room_id, updated);
    return NextResponse.json({ gameState: updated });
  }

  // ── cast-vote (atomic server-side) ──────────────────────────────────────────
  if (action === "cast-vote") {
    const row = await getStateByCode(roomCode);
    if (!row) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    const { voterId, targetId } = body;
    if (!voterId || !targetId) {
      return NextResponse.json({ error: "Missing voterId or targetId" }, { status: 400 });
    }
    const state = row.payload;
    const voter = state.players.find((p) => p.id === voterId);
    if (!voter || voter.isEliminated) {
      return NextResponse.json({ error: "Invalid voter" }, { status: 400 });
    }
    if (voter.hasVoted) {
      return NextResponse.json({ gameState: state }); // idempotent
    }
    const target = state.players.find((p) => p.id === targetId);
    if (!target || target.isEliminated) {
      return NextResponse.json({ error: "Invalid target" }, { status: 400 });
    }
    const updated = castVote(state, voterId, targetId, false);
    await updateState(row.room_id, updated);
    return NextResponse.json({ gameState: updated });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
