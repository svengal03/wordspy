import { NextRequest, NextResponse } from "next/server";
import Pusher from "pusher";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

export async function POST(req: NextRequest) {
  try {
    const { roomCode, event } = await req.json();
    await pusher.trigger(`wordspy-${roomCode}`, "game-event", event);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Pusher trigger error:", err);
    return NextResponse.json({ error: "Failed to broadcast event" }, { status: 500 });
  }
}
