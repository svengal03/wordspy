import { NextRequest, NextResponse } from "next/server";
import { leaveRoom } from "@/lib/db/players";

// POST /wordspy/api/rooms/[id]/leave
// Body: { playerId: string }
export async function POST(req: NextRequest) {
  let body: { playerId: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  await leaveRoom(body.playerId);
  return NextResponse.json({ ok: true });
}
