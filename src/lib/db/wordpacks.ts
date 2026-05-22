import { supabase } from "../supabase";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface WordPackRow {
  id: string;
  game: string;
  name: string;
  category: string;
  emoji: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface WordRow {
  id: string;
  pack_id: string;
  word_a: string;
  word_b: string | null;
  difficulty: number;
  created_at: string;
}

// ─── getPacks ─────────────────────────────────────────────────────────────────
// Fetch all active packs for a specific game.
// Safe to call from the browser (uses anon key + RLS public read).
export async function getPacks(game: string): Promise<WordPackRow[]> {
  const { data, error } = await supabase
    .from("word_packs")
    .select("*")
    .eq("game", game)
    .eq("is_active", true)
    .order("name");

  if (error) throw new Error(`getPacks: ${error.message}`);
  return (data ?? []) as WordPackRow[];
}

// ─── getWords ─────────────────────────────────────────────────────────────────
// Fetch all words for a given pack.
// Safe to call from the browser.
export async function getWords(packId: string): Promise<WordRow[]> {
  const { data, error } = await supabase
    .from("words")
    .select("*")
    .eq("pack_id", packId);

  if (error) throw new Error(`getWords: ${error.message}`);
  return (data ?? []) as WordRow[];
}

// ─── getRandomPairFromPack ────────────────────────────────────────────────────
// Convenience: pick one random word pair from a pack without loading all words.
// Used by the server-side game engine when starting a round.
export async function getRandomPairFromPack(
  packId: string
): Promise<{ word_a: string; word_b: string }> {
  // Supabase doesn't support TABLESAMPLE, so fetch all and pick randomly.
  const words = await getWords(packId);
  const pairs = words.filter((w) => w.word_b !== null);
  if (pairs.length === 0) throw new Error("No word pairs found in pack");
  const pick = pairs[Math.floor(Math.random() * pairs.length)];
  return { word_a: pick.word_a, word_b: pick.word_b! };
}
