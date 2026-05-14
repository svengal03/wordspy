export type Phase =
  | "setup"
  | "word-reveal"
  | "acting"
  | "round-result"
  | "game-over";

export interface Team {
  name: string;
  score: number;
  players: string[];
  actorIdx: number;
}

import type { Difficulty } from "@playhub/core";
export type { Difficulty };

export interface GameState {
  phase: Phase;
  teams: Team[];
  currentTeamIdx: number;
  timerDuration: number;
  selectedPackIds: string[];
  currentWord: string;
  wordOptions: [string, string, string];
  wordPool: string[];
  lastRoundCorrect: boolean | null;
  roundNumber: number;
  currentDifficulty: Difficulty;
  lastDifficulty: Difficulty | null;
}
