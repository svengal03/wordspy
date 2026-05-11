import { NextRequest, NextResponse } from "next/server";
import { generateRoomCode, createInitialGameState } from "@/lib/gameEngine";
import { DEFAULT_CONFIG } from "@/lib/gameEngine";

// In-memory room store (sufficient for party game sessions)
// In production upgrade: replace with Redis
const rooms = new Map<string, ReturnType<typeof createInitialGameState>>();

// Clean up rooms older than 4 hours
setInterval(() => {
  const fourHoursAgo = Date.now() - 4 * 60 * 60 * 1000;
  for (const [code, room] of rooms.entries()) {
    if (room.createdAt < fourHoursAgo) rooms.delete(code);
  }
}, 30 * 60 * 1000);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, roomCode, gameState } = body;

  if (action === "create") {
    const code = generateRoomCode();
    const state = createInitialGameState(code, DEFAULT_CONFIG);
    rooms.set(code, state);
    return NextResponse.json({ roomCode: code, gameState: state });
  }

  if (action === "get") {
    const state = rooms.get(roomCode);
    if (!state) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    return NextResponse.json({ gameState: state });
  }

  if (action === "update") {
    if (!rooms.has(roomCode)) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    rooms.set(roomCode, gameState);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
