import type { WordPackRow, WordRow } from "@/lib/db/wordpacks";

export async function fetchGameWordPacks(game: string): Promise<{
  packs: WordPackRow[];
  words: Record<string, WordRow[]>;
}> {
  const r = await fetch(`/api/packs?game=${game}`);
  return r.json();
}
