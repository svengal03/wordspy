import { supabase } from "@/lib/supabase";

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

// ─── Pack emoji map (emojis not stored in DB, resolved here) ─────────────────
const PACK_EMOJI: Record<string, string> = {
  "Animals": "🐾",
  "Bollywood": "🎬",
  "Bollywood Actors": "🎭",
  "Bollywood Movies": "🎬",
  "Bollywood Songs": "🎵",
  "Cricket": "🏏",
  "Desi Relationships": "💕",
  "Desi Street Food": "🍜",
  "English TV Shows": "📺",
  "General": "🎯",
  "Hollywood": "🎬",
  "Indian Music Artists": "🎤",
  "Indian Places": "🗺️",
  "Indian Politics": "🏛️",
  "Indian Web Series": "📱",
  "Music": "🎵",
  "Personalities": "👤",
  "Professions": "💼",
  "School & College": "🎓",
  "South Food": "🍛",
  "South Indian Food": "🍛",
  "Tech & Startups": "💻",
  "Tollywood Movies": "🎬",
  "Tollywood Songs": "🎵",
};

export function packEmoji(name: string): string {
  return PACK_EMOJI[name] ?? "🃏";
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

// ─── Server-side in-memory cache ─────────────────────────────────────────────
// Populated on first API request per game; warm workers serve subsequent users
// from memory with zero DB round-trips.
const _gameCache = new Map<string, { packs: WordPackRow[]; words: Record<string, WordRow[]> }>();

export async function getPacksWithWords(
  game: string
): Promise<{ packs: WordPackRow[]; words: Record<string, WordRow[]> }> {
  if (_gameCache.has(game)) return _gameCache.get(game)!;
  const packs = await getPacks(game);
  const wordEntries = await Promise.all(
    packs.map(async (p) => [p.id, await getWords(p.id)] as [string, WordRow[]])
  );
  const result = { packs, words: Object.fromEntries(wordEntries) };
  _gameCache.set(game, result);
  return result;
}

// ─── getWordList ──────────────────────────────────────────────────────────────
// Fetch only word_a strings for a pack — used by MindField to pick 25 tiles.
export async function getWordList(packId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("words")
    .select("word_a")
    .eq("pack_id", packId);
  if (error) throw new Error(`getWordList: ${error.message}`);
  return (data ?? []).map((r: { word_a: string }) => r.word_a).filter(Boolean);
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
