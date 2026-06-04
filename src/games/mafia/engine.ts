import { nanoid } from "nanoid";
import { Player, MafiaRole, GameState, GameConfig, NightResult } from "./types";
import { shuffle } from "@/lib/array";

export const MAFIA_PHASES = ["Role Reveal", "Night", "Day", "Vote", "Results"] as const;

export function createPlayer(name: string): Player {
  return { id: nanoid(6), name, role: null, isEliminated: false, hasSeenRole: false };
}

export function assignRoles(players: Player[], config: GameConfig): Player[] {
  const count = players.length;
  const playingCount = count - 1; // god doesn't play
  const playingRoles: MafiaRole[] = [];
  for (let i = 0; i < config.mafiaCount; i++) playingRoles.push("mafia");
  for (let i = 0; i < config.policeCount; i++) playingRoles.push("police");
  for (let i = 0; i < config.doctorCount; i++) playingRoles.push("doctor");
  while (playingRoles.length < playingCount) playingRoles.push("villager");
  const shuffledRoles = shuffle(playingRoles);
  return players.map((p, i) => ({
    ...p,
    role: i === 0 ? "god" : shuffledRoles[i - 1],
    hasSeenRole: false,
  }));
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
  const mafiaTargetPlayer = mafiaTarget ? state.players.find((p) => p.id === mafiaTarget) : null;
  const doctorTargetPlayer = doctorTarget ? state.players.find((p) => p.id === doctorTarget) : null;
  const mafiaTargetName = mafiaTargetPlayer?.name ?? null;
  const doctorTargetName = doctorTargetPlayer?.name ?? null;

  let policeResult: NightResult["policeResult"] = null;
  if (state.config.policeCount > 0 && policeTarget) {
    const t = state.players.find((p) => p.id === policeTarget);
    if (t) policeResult = { targetName: t.name, isMafia: t.role === "mafia" };
  }
  if (!mafiaTarget) return { killedId: null, killedName: null, killedRole: null, savedByDoctor: false, mafiaTargetName, doctorTargetName, policeResult };
  const savedByDoctor = state.config.doctorCount > 0 && mafiaTarget === doctorTarget;
  if (savedByDoctor) return { killedId: null, killedName: null, killedRole: null, savedByDoctor: true, mafiaTargetName, doctorTargetName, policeResult };
  const target = state.players.find((p) => p.id === mafiaTarget);
  if (!target || target.isEliminated) return { killedId: null, killedName: null, killedRole: null, savedByDoctor: false, mafiaTargetName, doctorTargetName, policeResult };
  return { killedId: target.id, killedName: target.name, killedRole: target.role, savedByDoctor: false, mafiaTargetName, doctorTargetName, policeResult };
}

export function eliminatePlayer(players: Player[], id: string): Player[] {
  return players.map((p) => (p.id === id ? { ...p, isEliminated: true } : p));
}

export function getMafiaTeammates(players: Player[], myId: string): string[] {
  return players.filter((p) => p.role === "mafia" && p.id !== myId).map((p) => p.name);
}
