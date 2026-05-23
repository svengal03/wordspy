import type { Difficulty } from "@playhub/core";

export function calcScore(timeLeft: number, timerDuration: number, difficulty: Difficulty): number {
  if (difficulty === "easy") return 1;
  const frac = timeLeft / timerDuration;
  if (difficulty === "medium") {
    if (frac >= 0.66) return 3;
    if (frac >= 0.33) return 2;
    return 1;
  }
  // hard: bigger range, higher floor
  if (frac >= 0.66) return 5;
  if (frac >= 0.33) return 3;
  return 2;
}
