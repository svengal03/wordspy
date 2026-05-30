import { NextRequest, NextResponse } from "next/server";
import { getMFStateByCode, revealMFTile, updateMFState, getMFState, getMFMeta } from "@/server/db/mindfield";
import { revealTile } from "@/games/mindfield/engine";
import { createServerClient } from "@/server/supabase";

export const runtime = "edge";

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

  const db = createServerClient();
  const { data: roundRow } = await db
    .from("mf_rounds")
    .select("id")
    .eq("room_id", row.room_id)
    .order("round_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!roundRow) return NextResponse.json({ error: "No active round" }, { status: 409 });

  const revealed = await revealMFTile(roundRow.id as string, body.tileId);
  if (!revealed) {
    const current = await getMFState(row.room_id);
    return NextResponse.json({ gameState: current!.state, conflict: true }, { status: 409 });
  }

  const newState = revealTile(state, body.tileId);
  await updateMFState(row.room_id, newState);

  // Engine state is authoritative; skip the heavy assemble and just refresh version
  const meta = await getMFMeta(row.room_id);
  const version = meta ? new Date(meta.updated_at).getTime() : newState.version;
  return NextResponse.json({ gameState: { ...newState, version } });
}
