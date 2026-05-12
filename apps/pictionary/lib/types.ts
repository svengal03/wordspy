export type Phase =
  | "setup"
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
