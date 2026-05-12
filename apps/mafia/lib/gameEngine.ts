import { nanoid } from "nanoid";
import { Player, MafiaRole, GameState, GameConfig, NightResult } from "./types";

export function createPlayer(name: string): Player {
  return { id: nanoid(6), name, role: null, isEliminated: false, hasSeenRole: false };
}

export function getMafiaCount(playerCount: number): number {
  // playerCount excludes god
  return Math.max(1, Math.floor(playerCount / 4));
}

export function assignRoles(players: Player[], config: GameConfig): Player[] {
  const count = players.length;
  const roles: MafiaRole[] = ["god"];
  const playingCount = count - 1; // god doesn't play
  const mafiaCount = getMafiaCount(playingCount);
  for (let i = 0; i < mafiaCount; i++) roles.push("mafia");
  if (config.policeEnabled) roles.push("police");
  if (config.doctorEnabled) roles.push("doctor");
  while (roles.length < count) roles.push("villager");
  // Fisher-Yates shuffle
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }
  return players.map((p, i) => ({ ...p, role: roles[i], hasSeenRole: false }));
}

export function getLiving(players: Player[]): Player[] {
  return players.filter((p) => !p.isEliminated);
}

export function getPlaying(players: Player[]): Player[] {
  return players.filter((p) => !p.isEliminated && p.role !== "god");
}

export function checkWin(players: Player[]): "mafia" | "villager" | null {
  const living = getPlaying(players);
  const mafiaCount = living.filter((p) => p.role === "mafia").length;
  const others = living.filter((p) => p.role !== "mafia").length;
  if (mafiaCount === 0) return "villager";
  if (mafiaCount >= others) return "mafia";
  return null;
}

export function resolveNight(state: GameState): NightResult {
  const { mafiaTarget, doctorTarget, policeTarget } = state.nightActions;
  // Police result
  let policeResult: NightResult["policeResult"] = null;
  if (state.config.policeEnabled && policeTarget) {
    const t = state.players.find((p) => p.id === policeTarget);
    if (t) policeResult = { targetName: t.name, isMafia: t.role === "mafia" };
  }
  if (!mafiaTarget) return { killedId: null, killedName: null, killedRole: null, savedByDoctor: false, policeResult };
  const savedByDoctor = state.config.doctorEnabled && mafiaTarget === doctorTarget;
  if (savedByDoctor) return { killedId: null, killedName: null, killedRole: null, savedByDoctor: true, policeResult };
  const target = state.players.find((p) => p.id === mafiaTarget);
  if (!target) return { killedId: null, killedName: null, killedRole: null, savedByDoctor: false, policeResult };
  return { killedId: target.id, killedName: target.name, killedRole: target.role, savedByDoctor: false, policeResult };
}

export function eliminatePlayer(players: Player[], id: string): Player[] {
  return players.map((p) => (p.id === id ? { ...p, isEliminated: true } : p));
}

export function getMafiaTeammates(players: Player[], myId: string): string[] {
  return players.filter((p) => p.role === "mafia" && p.id !== myId).map((p) => p.name);
}
