// ─── Player & Role Types ──────────────────────────────────────────────────────
export type Role = "civilian" | "undercover" | "ghost";

export interface Player {
  id: string;
  name: string;
  role: Role;
  word: string | null;
  isEliminated: boolean;
  isHost: boolean;
  clue: string | null;
  votes: number;
  hasVoted: boolean;
  joinedAt: number;
}

// ─── Game Phase ───────────────────────────────────────────────────────────────
export type GamePhase =
  | "lobby"       // waiting for players
  | "role-reveal" // each player sees their word privately
  | "clue"        // everyone gives a clue
  | "discussion"  // open chat + debate
  | "vote"        // voting who to eliminate
  | "elimination" // show who got eliminated + ghost guess
  | "summary";    // end of game

// ─── Game Config (host options) ───────────────────────────────────────────────
export interface GameConfig {
  packId: string;
  playerCount: number;
  undercoverCount: number;
  ghostEnabled: boolean;
  safeRound: boolean;      // no elimination in round 1
  tieBreaker: boolean;     // re-clue and revote on ties
  jurySystem: boolean;     // eliminated players vote in final round
  clueTimerSeconds: number | null; // null = no timer
}

// ─── Chat Message ─────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  timestamp: number;
  type: "message" | "system";
}

// ─── Game State ───────────────────────────────────────────────────────────────
export interface GameState {
  roomCode: string;
  phase: GamePhase;
  round: number;
  players: Player[];
  config: GameConfig;
  wordPair: { civilian: string; undercover: string } | null;
  currentCluePlayerIndex: number;
  currentVoterIndex: number;
  eliminatedThisRound: string | null;
  ghostGuessAllowed: boolean;
  ghostGuess: string | null;
  winner: "civilians" | "undercover" | "ghost" | null;
  chat: ChatMessage[];
  createdAt: number;
}

// ─── Game Event Types (Pusher) ───────────────────────────────────────────────
export type GameEventType =
  | "player-joined"
  | "player-left"
  | "game-state-update"
  | "clue-submitted"
  | "vote-cast"
  | "ghost-guess"
  | "chat-message"
  | "phase-change"
  | "host-action";

export interface GameEvent {
  type: GameEventType;
  payload: unknown;
  senderId: string;
  timestamp: number;
}

// ─── Default Config ───────────────────────────────────────────────────────────
export const DEFAULT_CONFIG: GameConfig = {
  packId: "bollywood",
  playerCount: 5,
  undercoverCount: 1,
  ghostEnabled: true,
  safeRound: true,
  tieBreaker: true,
  jurySystem: false,
  clueTimerSeconds: null,
};

// ─── Role counts by player count ─────────────────────────────────────────────
export function getRoleCounts(playerCount: number): {
  civilians: number;
  undercovers: number;
  ghosts: number;
} {
  if (playerCount <= 4) return { civilians: playerCount - 1, undercovers: 1, ghosts: 0 };
  if (playerCount <= 6) return { civilians: playerCount - 2, undercovers: 1, ghosts: 1 };
  if (playerCount <= 8) return { civilians: playerCount - 3, undercovers: 2, ghosts: 1 };
  return { civilians: playerCount - 3, undercovers: 2, ghosts: 1 };
}
