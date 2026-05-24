export type GamePhase =
  | "lobby"
  | "setup"
  | "team-assign"
  | "clue"
  | "guess"
  | "opposing-bet"
  | "reveal"
  | "game-over";

export type TeamId = "A" | "B";
export type OpposingBet = "left" | "right";
export type ScoreZone = "bullseye" | "close" | "almost" | "miss";

export interface SpectrumCard {
  id: string;
  left: string;
  right: string;
}

export interface Player {
  id: string;
  name: string;
  teamId: TeamId;
}

export interface Team {
  id: TeamId;
  score: number;
  psychicIndex: number;
}

export interface RoundResult {
  round: number;
  psychicTeamId: TeamId;
  psychicName: string;
  cardLeft: string;
  cardRight: string;
  clue: string;
  targetPosition: number;
  needlePosition: number;
  zone: ScoreZone;
  pointsScored: number;
  opposingBet: OpposingBet | null;
  opposingBetCorrect: boolean | null;
  opposingPointsScored: number;
}

export interface GameConfig {
  targetScore: number;
  enableOpposingBet: boolean;
  randomTeams: boolean;
  packId: string;
  guessTimerSeconds: number; // 0 = disabled
}

export const DEFAULT_CONFIG: GameConfig = {
  targetScore: 10,
  enableOpposingBet: true,
  randomTeams: true,
  packId: "",
  guessTimerSeconds: 60,
};

export interface GameState {
  phase: GamePhase;
  hostName: string;
  players: Player[];
  teams: [Team, Team];
  config: GameConfig;
  round: number;
  currentTeamId: TeamId;
  currentPsychicId: string | null;
  currentCard: SpectrumCard | null;
  targetPosition: number;
  clue: string | null;
  needlePosition: number;
  opposingBet: OpposingBet | null;
  lastResult: RoundResult | null;
  history: RoundResult[];
  winner: TeamId | null;
  usedCardIds: string[];
}
