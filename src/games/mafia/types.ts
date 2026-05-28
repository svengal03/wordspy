export type MafiaRole = "mafia" | "villager" | "doctor" | "police" | "god";
export type GamePhase = "setup" | "get-ready" | "role-reveal" | "night" | "day" | "vote" | "game-over";
export type NightSubPhase = "sleeping" | "mafia-wake" | "doctor-wake" | "police-wake" | "resolving";

export interface Player {
  id: string;
  name: string;
  role: MafiaRole | null;
  isEliminated: boolean;
  hasSeenRole: boolean;
}

export interface GameConfig {
  doctorEnabled: boolean;
  policeEnabled: boolean;
  doctorCanSelfSave: boolean;
  votingTimerEnabled: boolean;
  votingTimerSeconds: number;
  discussionTimerSeconds: number;
}

export interface NightActions {
  mafiaTarget: string | null;
  doctorTarget: string | null;
  policeTarget: string | null;
  doctorLastTarget: string | null;
}

export interface NightResult {
  killedId: string | null;
  killedName: string | null;
  killedRole: MafiaRole | null;
  savedByDoctor: boolean;
  policeResult: { targetName: string; isMafia: boolean } | null;
}

export interface EliminationRecord {
  round: number;
  phase: "night" | "day";
  playerName: string;
  role: MafiaRole;
}

export interface GameState {
  phase: GamePhase;
  nightSubPhase: NightSubPhase;
  round: number;
  players: Player[];
  config: GameConfig;
  nightActions: NightActions;
  nominatedPlayerId: string | null;
  // offline vote: host manually tallies by counting raised hands
  voteYes: number;
  voteNo: number;
  lastNightResult: NightResult | null;
  eliminationHistory: EliminationRecord[];
  winner: "mafia" | "villager" | null;
  revealIndex: number; // which player is currently doing role reveal
}

export const DEFAULT_CONFIG: GameConfig = {
  doctorEnabled: true,
  policeEnabled: true,
  doctorCanSelfSave: true,
  votingTimerEnabled: false,
  votingTimerSeconds: 60,
  discussionTimerSeconds: 180,
};
