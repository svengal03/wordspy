import { NextResponse } from "next/server";
import Ably from "ably";

export async function GET() {
  try {
    const ably = new Ably.Rest(process.env.ABLY_API_KEY!);
    const tokenRequest = await ably.auth.createTokenRequest({
      clientId: `wordspy-${Date.now()}`,
    });
    return NextResponse.json(tokenRequest);
  } catch (err) {
    console.error("Ably token error:", err);
    return NextResponse.json(
      { error: "Failed to create Ably token" },
      { status: 500 }
    );
  }
}
