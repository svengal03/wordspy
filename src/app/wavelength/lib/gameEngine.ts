import { nanoid } from "nanoid";
import {
  GameState, GameConfig, Player, Team, TeamId,
  OpposingBet, ScoreZone, RoundResult, SpectrumCard,
} from "./types";
import { drawCard } from "./spectrumCards";

export const ZONE_POINTS: Record<ScoreZone, number> = {
  bullseye: 4,
  close: 3,
  almost: 2,
  miss: 0,
};

export function createPlayer(name: string, teamId: TeamId): Player {
  return { id: nanoid(), name, teamId };
}

function makeTeam(id: TeamId): Team {
  return { id, score: 0, psychicIndex: 0 };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function assignTeamsRandomly(players: Player[]): Player[] {
  const shuffled = shuffle(players);
  return shuffled.map((p, i) => ({ ...p, teamId: (i < Math.ceil(shuffled.length / 2) ? "A" : "B") as TeamId }));
}

function randomTarget(): number {
  return Math.floor(Math.random() * 81) + 10; // [10, 90]
}

function getTeamPlayers(players: Player[], teamId: TeamId): Player[] {
  return players.filter((p) => p.teamId === teamId);
}

function getCurrentPsychic(players: Player[], teams: [Team, Team], teamId: TeamId): string | null {
  const team = teams.find((t) => t.id === teamId)!;
  const teamPlayers = getTeamPlayers(players, teamId);
  if (teamPlayers.length === 0) return null;
  return teamPlayers[team.psychicIndex % teamPlayers.length].id;
}

export function startGame(players: Player[], config: GameConfig): Partial<GameState> {
  const teams: [Team, Team] = [makeTeam("A"), makeTeam("B")];
  const card = drawCard(config.packId, []);
  const psychicId = getCurrentPsychic(players, teams, "A");
  return {
    phase: "clue",
    players,
    teams,
    config,
    round: 1,
    currentTeamId: "A",
    currentPsychicId: psychicId,
    currentCard: card,
    targetPosition: randomTarget(),
    clue: null,
    needlePosition: 50,
    opposingBet: null,
    lastResult: null,
    history: [],
    winner: null,
    usedCardIds: [card.id],
  };
}

export function submitClue(state: GameState, clue: string): Partial<GameState> {
  return { clue, phase: "guess" };
}

export function lockNeedle(state: GameState, position: number): Partial<GameState> {
  const next: Partial<GameState> = { needlePosition: position };
  next.phase = state.config.enableOpposingBet ? "opposing-bet" : "reveal";
  return next;
}

export function submitOpposingBet(state: GameState, bet: OpposingBet): Partial<GameState> {
  return { opposingBet: bet, phase: "reveal" };
}

export function getScoreZone(target: number, needle: number): ScoreZone {
  const d = Math.abs(needle - target);
  if (d <= 5) return "bullseye";
  if (d <= 15) return "close";
  if (d <= 25) return "almost";
  return "miss";
}

function evaluateOpposingBet(target: number, needle: number, bet: OpposingBet | null): boolean | null {
  if (bet === null || target === needle) return null;
  return bet === "left" ? target < needle : target > needle;
}

export function resolveReveal(state: GameState): Partial<GameState> {
  const zone = getScoreZone(state.targetPosition, state.needlePosition);
  const points = ZONE_POINTS[zone];
  const betCorrect = evaluateOpposingBet(state.targetPosition, state.needlePosition, state.opposingBet);
  const opposingPoints = betCorrect === true ? 1 : 0;

  const psychic = state.players.find((p) => p.id === state.currentPsychicId);
  const opposingTeamId: TeamId = state.currentTeamId === "A" ? "B" : "A";

  const result: RoundResult = {
    round: state.round,
    psychicTeamId: state.currentTeamId,
    psychicName: psychic?.name ?? "",
    cardLeft: state.currentCard?.left ?? "",
    cardRight: state.currentCard?.right ?? "",
    clue: state.clue ?? "",
    targetPosition: state.targetPosition,
    needlePosition: state.needlePosition,
    zone,
    pointsScored: points,
    opposingBet: state.opposingBet,
    opposingBetCorrect: betCorrect,
    opposingPointsScored: opposingPoints,
  };

  const newTeams: [Team, Team] = state.teams.map((t) => {
    if (t.id === state.currentTeamId) return { ...t, score: t.score + points };
    if (t.id === opposingTeamId) return { ...t, score: t.score + opposingPoints };
    return t;
  }) as [Team, Team];

  const winner = checkWinCondition(newTeams, state.config);

  return {
    teams: newTeams,
    lastResult: result,
    history: [...state.history, result],
    winner,
    phase: "reveal",
  };
}

export function nextRound(state: GameState): Partial<GameState> {
  const nextTeamId: TeamId = state.currentTeamId === "A" ? "B" : "A";

  const newTeams: [Team, Team] = state.teams.map((t) => {
    if (t.id === state.currentTeamId) {
      const teamPlayers = getTeamPlayers(state.players, t.id);
      return { ...t, psychicIndex: (t.psychicIndex + 1) % teamPlayers.length };
    }
    return t;
  }) as [Team, Team];

  const card = drawCard(state.config.packId, state.usedCardIds);
  const psychicId = getCurrentPsychic(state.players, newTeams, nextTeamId);
  const newUsed = state.usedCardIds.includes(card.id) ? state.usedCardIds : [...state.usedCardIds, card.id];

  return {
    phase: "clue",
    round: state.round + 1,
    currentTeamId: nextTeamId,
    currentPsychicId: psychicId,
    currentCard: card,
    targetPosition: randomTarget(),
    clue: null,
    needlePosition: 50,
    opposingBet: null,
    teams: newTeams,
    usedCardIds: newUsed,
  };
}

export function checkWinCondition(teams: [Team, Team], config: GameConfig): TeamId | null {
  const aWins = teams[0].score >= config.targetScore;
  const bWins = teams[1].score >= config.targetScore;
  if (aWins && bWins) {
    if (teams[0].score > teams[1].score) return "A";
    if (teams[1].score > teams[0].score) return "B";
    return null; // exact tie: continue
  }
  if (aWins) return "A";
  if (bWins) return "B";
  return null;
}
