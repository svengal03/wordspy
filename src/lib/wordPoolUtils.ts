import type { WordRow } from "@/server/db/wordpacks";

export function buildWordPool(
  packIds: string[],
  rows: Record<string, WordRow[]>,
  allVariants = false,
): string[] {
  const words: string[] = [];
  for (const packId of packIds) {
    for (const row of rows[packId] ?? []) {
      if (allVariants) {
        words.push(row.word_a);
        if (row.word_b) words.push(row.word_b);
      } else {
        words.push(Math.random() < 0.5 ? row.word_a : (row.word_b ?? row.word_a));
      }
    }
  }
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [words[i], words[j]] = [words[j]!, words[i]!];
  }
  return words;
}

export function pickThree(
  pool: string[],
  fallback: string[],
  rows: Record<string, WordRow[]>,
  allVariants = false,
): { options: [string, string, string]; remaining: string[] } {
  let p = pool.length >= 3 ? pool : [...pool, ...buildWordPool(fallback, rows, allVariants)];
  if (p.length === 0) return { options: ["", "", ""], remaining: [] };
  while (p.length < 3) p = [...p, ...p];

  const options: string[] = [];
  const remaining: string[] = [];
  for (const word of p) {
    if (options.length < 3 && !options.includes(word)) {
      options.push(word);
    } else {
      remaining.push(word);
    }
  }
  while (options.length < 3) options.push(options[0] ?? "");

  return { options: options as [string, string, string], remaining };
}
