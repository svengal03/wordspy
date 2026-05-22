import { getPacks, getWords } from "@/lib/db/wordpacks";
import { SpectrumCard } from "./types";

export type { SpectrumCard };

export async function getWavelengthPacks() {
  return getPacks("wavelength");
}

export async function getSpectrumPack(packId: string): Promise<SpectrumCard[]> {
  const rows = await getWords(packId);
  return rows.map((row, i) => ({
    id: `${packId}-${i}`,
    left: row.word_a,
    right: row.word_b ?? row.word_a,
  }));
}

export async function drawCard(packId: string, usedCardIds: string[]): Promise<SpectrumCard> {
  const cards = await getSpectrumPack(packId);
  const available = cards.filter((c) => !usedCardIds.includes(c.id));
  const pool = available.length > 0 ? available : cards;
  return pool[Math.floor(Math.random() * pool.length)];
}
