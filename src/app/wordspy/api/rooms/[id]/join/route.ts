import { NextRequest, NextResponse } from "next/server";
import { joinRoom } from "@/lib/db/players";
import { getRoom, updateRoom } from "@/lib/db/rooms";

// POST /wordspy/api/rooms/[id]/join
// Body: { playerName: string, isHost?: boolean }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let body: { playerName: string; isHost?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { id: roomCode } = await params;
  const room = await getRoom(roomCode);
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }
  if (room.status === "ended") {
    return NextResponse.json({ error: "This room has ended" }, { status: 410 });
  }

  const player = await joinRoom(room.id, body.playerName, body.isHost ?? false);

  // If this is the first player / host, set them as host on the room
  if (body.isHost) {
    await updateRoom(room.id, { host_id: player.id });
  }

  return NextResponse.json({ player, room });
}
