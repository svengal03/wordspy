import { NextRequest, NextResponse } from "next/server";
import { generateRoomCode, createInitialGameState, castVote } from "@/lib/gameEngine";
import { DEFAULT_CONFIG } from "@/lib/types";
import type { GameState } from "@/lib/types";

// In-memory room store (sufficient for party game sessions)
const rooms: Record<string, GameState> = {};

// Clean up rooms older than 4 hours
setInterval(() => {
  const fourHoursAgo = Date.now() - 4 * 60 * 60 * 1000;
  Object.keys(rooms).forEach((code) => {
    if (rooms[code].createdAt < fourHoursAgo) delete rooms[code];
  });
}, 30 * 60 * 1000);

export async function POST(req: NextRequest) {
  const body = await req.json();
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
    const updated = { ...state, players: state.players.filter((p) => p.id !== playerId) };
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
