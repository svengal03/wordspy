import { NextRequest, NextResponse } from "next/server";
import { getMFStateByCode, updateMFState } from "@/server/db/mindfield";
import { assignTiles, startNextRound } from "@/games/mindfield/engine";
import { getWordList } from "@/server/db/wordpacks";

// Module-level cache per serverless instance — avoids re-fetching the same pack
// on every round start within the same function lifetime.
const wordCache = new Map<string, string[]>();

async function fetchWords(packId: string): Promise<string[]> {
  const cached = wordCache.get(packId);
  if (cached) return cached;
  const words = await getWordList(packId);
  if (words.length < 25) throw new Error("Not enough words in pack (need at least 25)");
  wordCache.set(packId, words);
  return words;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let body: { action: "start" | "next-round" };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const { id: roomCode } = await params;
  const row = await getMFStateByCode(roomCode);
  if (!row) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const state = row.payload;

  if (!state.config.packId) {
    return NextResponse.json({ error: "No word pack selected" }, { status: 400 });
  }

  let words: string[];
  try {
    words = await fetchWords(state.config.packId);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  const tiles = assignTiles(words);

  let newState = state;

  if (body.action === "start") {
    const redPlayers = state.players.filter(p => p.team === "red");
    const bluePlayers = state.players.filter(p => p.team === "blue");
    const redSpy = redPlayers.some(p => p.role === "spymaster");
    const blueSpy = bluePlayers.some(p => p.role === "spymaster");
    if (redPlayers.length < 2 || bluePlayers.length < 2 || !redSpy || !blueSpy) {
      return NextResponse.json({ error: "Teams not ready" }, { status: 400 });
    }
    newState = startNextRound({ ...state, round: 0 }, tiles);
  } else if (body.action === "next-round") {
    if (state.phase !== "round-over") {
      return NextResponse.json({ error: "Not in round-over phase" }, { status: 409 });
    }
    newState = startNextRound(state, tiles);
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  await updateMFState(row.room_id, newState);
  return NextResponse.json({ gameState: newState });
}
