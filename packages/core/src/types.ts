export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isEliminated: boolean;
}

export interface Room {
  code: string;
  players: Player[];
  createdAt: number;
}

export type GamePhase =
  | "lobby"
  | "playing"
  | "summary";
