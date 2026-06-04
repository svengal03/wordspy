export type Phase =
  | "lobby"
  | "setup"
  | "team-assign"
  | "get-ready"
  | "word-reveal"
  | "drawing"
  | "round-result"
  | "game-over";

export interface Team {
  name: string;
  score: number;
  players: string[];
  drawerIdx: number;
}

import type { Difficulty } from "@playhub/core";
export type { Difficulty };

export interface DrawingStroke {
  type: "start" | "move" | "end";
  x: number;
  y: number;
  color: string;
  size: number;
  eraser: boolean;
}

export interface GameState {
  phase: Phase;
  hostName: string;
  teams: Team[];
  currentTeamIdx: number;
  timerDuration: number;
  selectedPackIds: string[];
  currentWord: string;
  wordOptions: [string, string, string];
  wordPool: string[];
  lastRoundCorrect: boolean | null;
  pointsLastRound: number | null;
  lastDrawingStrokes: DrawingStroke[];
  drawingReplayEnabled: boolean;
  roundNumber: number;
  currentDifficulty: Difficulty;
  lastDifficulty: Difficulty | null;
}
