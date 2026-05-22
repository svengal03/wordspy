import { WORD_PACKS } from "@playhub/core";
import { SpectrumCard } from "./types";

export type { SpectrumCard };

export function getWavelengthPacks() {
  return WORD_PACKS.filter((p) => p.games.includes("wavelength"));
}

export function getSpectrumPack(packId: string): SpectrumCard[] {
  const pack =
    WORD_PACKS.find((p) => p.id === packId && p.games.includes("wavelength")) ??
    WORD_PACKS.find((p) => p.id === "wavelength-general")!;
  return pack.pairs.map((pair, i) => ({
    id: `${pack.id}-${i}`,
    left: pair.word1,
    right: pair.word2,
  }));
}

export function drawCard(packId: string, usedCardIds: string[]): SpectrumCard {
  const cards = getSpectrumPack(packId);
  const available = cards.filter((c) => !usedCardIds.includes(c.id));
  const pool = available.length > 0 ? available : cards;
  return pool[Math.floor(Math.random() * pool.length)];
}
