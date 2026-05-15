import { WORD_PACKS } from "./wordPacks";
import type { WordPair, WordPack } from "./wordPacks";

export function getRandomPair(packId: string): WordPair {
  const pack = WORD_PACKS.find((p) => p.id === packId);
  if (!pack) return { word1: "Dosa", word2: "Uttapam" };
  return pack.pairs[Math.floor(Math.random() * pack.pairs.length)]!;
}

export function getPackById(packId: string): WordPack | undefined {
  return WORD_PACKS.find((p) => p.id === packId);
}
