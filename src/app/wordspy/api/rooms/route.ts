import { NextRequest, NextResponse } from "next/server";
import { generateRoomCode, createInitialGameState, castVote } from "../../lib/gameEngine";
import { DEFAULT_CONFIG } from "../../lib/types";
import type { GameState } from "../../lib/types";

// In-memory room store (sufficient for party game sessions)
const rooms: Record<string, GameState> = {};

// Clean up idle rooms older than 4 hours, or any room older than 24 hours
setInterval(() => {
  const fourHoursAgo = Date.now() - 4 * 60 * 60 * 1000;
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  Object.keys(rooms).forEach((code) => {
    const room = rooms[code];
    const isIdle = room.phase === "summary" || room.phase === "lobby";
    if ((isIdle && room.createdAt < fourHoursAgo) || room.createdAt < oneDayAgo) {
      delete rooms[code];
    }
  });
}, 30 * 60 * 1000);

export async function POST(req: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { action, roomCode, gameState } = body;

  if (action === "create") {
    const code = generateRoomCode();
    const state = createInitialGameState(code, DEFAULT_CONFIG);
    rooms[code] = state;
    return NextResponse.json({ roomCode: code, gameState: state });
  }

  if (action === "get") {
    const state = rooms[roomCode];
    if (!state) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    return NextResponse.json({ gameState: state });
  }

  if (action === "update") {
    if (!rooms[roomCode]) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    rooms[roomCode] = gameState;
    return NextResponse.json({ ok: true });
  }

  if (action === "remove-player") {
    const state = rooms[roomCode];
    if (!state) return NextResponse.json({ error: "Room not found" }, { status: 404 });
    const { playerId } = body;
    const removedPlayer = state.players.find((p) => p.id === playerId);
    let remaining = state.players.filter((p) => p.id !== playerId);
    if (removedPlayer?.isHost && remaining.length > 0) {
      remaining = remaining.map((p, i) => i === 0 ? { ...p, isHost: true } : p);
    }
    const updated = { ...state, players: remaining };
    rooms[roomCode] = updated;
    return NextResponse.json({ gameState: updated });
  }

  // Atomically apply a single vote server-side to prevent race conditions
  if (action === "cast-vote") {
    const state = rooms[roomCode];
    if (!state) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    const { voterId, targetId } = body;
    const voter = state.players.find((p) => p.id === voterId);
    if (voter?.hasVoted) {
      // Idempotent: already voted, return current state
      return NextResponse.json({ gameState: state });
    }
    const updated = castVote(state, voterId, targetId, false);
    rooms[roomCode] = updated;
    return NextResponse.json({ gameState: updated });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
