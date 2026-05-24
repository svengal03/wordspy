export type TeamColor = "red" | "blue";
export type TileColor = "red" | "blue" | "neutral" | "bomb";
export type PlayerRole = "spymaster" | "agent";
export type TurnPhase = "giving-clue" | "guessing";
export type GamePhase = "lobby" | "playing" | "round-over" | "game-over";

export interface Tile {
  id: number;
  word: string;
  color: TileColor;
  revealed: boolean;
}

export interface Player {
  id: string;
  name: string;
  team: TeamColor | null;
  role: PlayerRole | null;
  isHost: boolean;
  joinedAt: number;
}

export interface RoundRecord {
  round: number;
  winner: TeamColor;
  bombTriggered: boolean;
  bombTriggeredBy: TeamColor | null;
  winnerUsedBigClue: boolean;
  redPointsEarned: number;
  bluePointsEarned: number;
}

export interface GameConfig {
  packId: string;
  targetWins: number;
}

export const DEFAULT_CONFIG: GameConfig = {
  packId: "",
  targetWins: 3,
};

export interface GameState {
  roomCode: string;
  phase: GamePhase;
  players: Player[];
  config: GameConfig;

  tiles: Tile[];

  currentTeam: TeamColor;
  turnPhase: TurnPhase;
  clue: string | null;
  clueNumber: number | null;
  guessesRemaining: number;

  bigClueUsedRed: boolean;
  bigClueUsedBlue: boolean;
  roundWinner: TeamColor | null;
  bombTriggeredBy: TeamColor | null;

  redWins: number;
  blueWins: number;
  redPoints: number;
  bluePoints: number;
  winner: TeamColor | null;

  roundHistory: RoundRecord[];
  round: number;
  createdAt: number;
}
