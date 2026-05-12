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

export interface GameState {
  phase: Phase;
  teams: Team[];
  currentTeamIdx: number;
  timerDuration: number;
  selectedPackIds: string[];
  currentWord: string;
  wordPool: string[];
  lastRoundCorrect: boolean | null;
  roundNumber: number;
}
