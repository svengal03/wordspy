import { NextRequest, NextResponse } from "next/server";
import { getMFStateByCode, revealMFTile, updateMFState, getMFState } from "@/server/db/mindfield";
import { revealTile } from "@/games/mindfield/engine";
import { createServerClient } from "@/server/supabase";

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

  const state = row.state;

  if (state.phase !== "playing" || state.turnPhase !== "guessing") {
    return NextResponse.json({ error: "Not in guessing phase" }, { status: 409 });
  }

  // Get current round id
  const db = createServerClient();
  const { data: roundRow } = await db
    .from("mf_rounds")
    .select("id")
    .eq("room_id", row.room_id)
    .order("round_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!roundRow) return NextResponse.json({ error: "No active round" }, { status: 409 });

  // Atomic reveal — returns null if already revealed
  const revealed = await revealMFTile(roundRow.id as string, body.tileId);
  if (!revealed) {
    // Already revealed — return current state
    const current = await getMFState(row.room_id);
    return NextResponse.json({ gameState: current!.state, conflict: true }, { status: 409 });
  }

  // Run game logic on current state to compute transitions
  const newState = revealTile(state, body.tileId);

  // Persist turn/round state changes (phase, scores, round results, etc.)
  await updateMFState(row.room_id, newState);

  const fresh = await getMFState(row.room_id);
  return NextResponse.json({ gameState: fresh!.state });
}
