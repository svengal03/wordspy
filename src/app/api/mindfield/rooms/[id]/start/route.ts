import { NextRequest, NextResponse } from "next/server";
import { getMFStateByCode, getMFState, insertMFRound } from "@/server/db/mindfield";
import { assignTiles } from "@/games/mindfield/engine";
import { createServerClient } from "@/server/supabase";

export const runtime = "edge";

const wordCache = new Map<string, string[]>();

async function fetchWords(packId: string): Promise<string[]> {
  if (wordCache.has(packId)) return wordCache.get(packId)!;
  const db = createServerClient();
  const { data, error } = await db.from("words").select("word_a").eq("pack_id", packId);
  if (error) throw new Error(error.message);
  const words = (data ?? []).map((r: { word_a: string }) => r.word_a).filter(Boolean);
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

  const state = row.state;

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

  if (body.action === "start") {
    const redPlayers = state.players.filter(p => p.team === "red");
    const bluePlayers = state.players.filter(p => p.team === "blue");
    const redSpy  = redPlayers.some(p => p.role === "spymaster");
    const blueSpy = bluePlayers.some(p => p.role === "spymaster");
    if (redPlayers.length < 2 || bluePlayers.length < 2 || !redSpy || !blueSpy) {
      return NextResponse.json({ error: "Teams not ready" }, { status: 400 });
    }
    await insertMFRound(row.room_id, 1, tiles);
  } else if (body.action === "next-round") {
    if (state.phase !== "round-over") {
      return NextResponse.json({ error: "Not in round-over phase" }, { status: 409 });
    }
    await insertMFRound(row.room_id, state.round + 1, tiles);
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const fresh = await getMFState(row.room_id);
  return NextResponse.json({ gameState: fresh!.state });
}
