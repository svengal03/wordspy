import { NextRequest, NextResponse } from "next/server";
import { getPacksWithWords } from "@/lib/db/wordpacks";

export async function GET(req: NextRequest) {
  const game = req.nextUrl.searchParams.get("game");
  if (!game) return NextResponse.json({ error: "game required" }, { status: 400 });
  try {
    const data = await getPacksWithWords(game);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
