import { GameState, Player, Role, GameConfig, getRoleCounts } from "./types";
import { getRandomPair } from "./wordPacks";
import { nanoid } from "nanoid";

// ─── Room Code Generator ──────────────────────────────────────────────────────
export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

// ─── Assign roles to players ──────────────────────────────────────────────────
export function assignRoles(
  players: Player[],
  config: GameConfig
): Player[] {
  const pair = getRandomPair(config.packId);
  const { undercovers, ghosts } = getRoleCounts(players.length);

  // Build role pool
  const roles: Role[] = [
    ...Array(undercovers).fill("undercover"),
    ...Array(config.ghostEnabled ? ghosts : 0).fill("ghost"),
    ...Array(
      players.length - undercovers - (config.ghostEnabled ? ghosts : 0)
    ).fill("civilian"),
  ];

  // Shuffle roles
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }

  return players.map((player, i) => ({
    ...player,
    role: roles[i],
    word:
      roles[i] === "civilian"
        ? pair.civilian
        : roles[i] === "undercover"
        ? pair.undercover
        : null,
    clue: null,
    votes: 0,
    hasVoted: false,
    isEliminated: false,
  }));
}

// ─── Create initial game state ────────────────────────────────────────────────
export function createInitialGameState(
  roomCode: string,
  config: GameConfig
): GameState {
  return {
    roomCode,
    phase: "lobby",
    round: 0,
    players: [],
    config,
    wordPair: null,
    currentCluePlayerIndex: 0,
    eliminatedThisRound: null,
    ghostGuessAllowed: false,
    ghostGuess: null,
    winner: null,
    chat: [],
    createdAt: Date.now(),
  };
}

// ─── Start game ───────────────────────────────────────────────────────────────
export function startGame(state: GameState): GameState {
  const pair = getRandomPair(state.config.packId);
  const assignedPlayers = assignRoles(state.players, state.config);
  const startIndex = Math.floor(Math.random() * assignedPlayers.length);

  return {
    ...state,
    phase: "role-reveal",
    round: 1,
    players: assignedPlayers,
    wordPair: pair,
    currentCluePlayerIndex: startIndex,
    eliminatedThisRound: null,
    ghostGuessAllowed: false,
    ghostGuess: null,
    winner: null,
  };
}

// ─── Submit clue ──────────────────────────────────────────────────────────────
export function submitClue(
  state: GameState,
  playerId: string,
  clue: string
): GameState {
  const players = state.players.map((p) =>
    p.id === playerId ? { ...p, clue } : p
  );

  // Find next active player index
  const activePlayers = players.filter((p) => !p.isEliminated);
  const currentIdx = state.currentCluePlayerIndex;
  const nextIdx = (currentIdx + 1) % players.length;

  // Check if all active players have given clues
  const allClued = activePlayers.every((p) => p.clue !== null);

  return {
    ...state,
    players,
    currentCluePlayerIndex: nextIdx,
    phase: allClued ? "discussion" : "clue",
  };
}

// ─── Cast vote ────────────────────────────────────────────────────────────────
export function castVote(
  state: GameState,
  voterId: string,
  targetId: string
): GameState {
  const players = state.players.map((p) => {
    if (p.id === voterId) return { ...p, hasVoted: true };
    if (p.id === targetId) return { ...p, votes: p.votes + 1 };
    return p;
  });

  const activePlayers = players.filter((p) => !p.isEliminated);
  const allVoted = activePlayers.every((p) => p.hasVoted);

  if (!allVoted) return { ...state, players };

  // Tally votes
  return processVotes({ ...state, players });
}

// ─── Process votes & eliminate ────────────────────────────────────────────────
function processVotes(state: GameState): GameState {
  const activePlayers = state.players.filter((p) => !p.isEliminated);
  const maxVotes = Math.max(...activePlayers.map((p) => p.votes));
  const topVoted = activePlayers.filter((p) => p.votes === maxVotes);

  // Tie and tiebreaker enabled → go back to clue phase with tied players only
  if (topVoted.length > 1 && state.config.tieBreaker) {
    const players = state.players.map((p) => ({
      ...p,
      votes: 0,
      hasVoted: false,
      clue: topVoted.find((tv) => tv.id === p.id) ? null : p.clue,
    }));
    return { ...state, players, phase: "clue" };
  }

  // Eliminate player with most votes (random if tie & no tiebreaker)
  const eliminated = topVoted[Math.floor(Math.random() * topVoted.length)];
  const players = state.players.map((p) =>
    p.id === eliminated.id ? { ...p, isEliminated: true } : p
  );

  const ghostGuessAllowed = eliminated.role === "ghost";

  return {
    ...state,
    players,
    phase: "elimination",
    eliminatedThisRound: eliminated.id,
    ghostGuessAllowed,
  };
}

// ─── Check win condition ──────────────────────────────────────────────────────
export function checkWinCondition(
  state: GameState
): "civilians" | "undercover" | "ghost" | null {
  const active = state.players.filter((p) => !p.isEliminated);
  const civilians = active.filter((p) => p.role === "civilian");
  const undercovers = active.filter((p) => p.role === "undercover");
  const ghosts = active.filter((p) => p.role === "ghost");

  // All undercovers and ghosts eliminated → civilians win
  if (undercovers.length === 0 && ghosts.length === 0) return "civilians";

  // Only 1 civilian left with infiltrators → undercover/ghost win
  if (civilians.length <= 1 && (undercovers.length > 0 || ghosts.length > 0))
    return "undercover";

  return null;
}

// ─── Next round ───────────────────────────────────────────────────────────────
export function nextRound(state: GameState): GameState {
  const winner = checkWinCondition(state);
  if (winner) return { ...state, phase: "summary", winner };

  const players = state.players.map((p) => ({
    ...p,
    clue: null,
    votes: 0,
    hasVoted: false,
  }));

  const activePlayers = players.filter((p) => !p.isEliminated);
  const startIndex = Math.floor(Math.random() * activePlayers.length);
  const globalIndex = players.findIndex(
    (p) => p.id === activePlayers[startIndex].id
  );

  return {
    ...state,
    players,
    phase: "clue",
    round: state.round + 1,
    currentCluePlayerIndex: globalIndex,
    eliminatedThisRound: null,
    ghostGuessAllowed: false,
    ghostGuess: null,
  };
}

// ─── Ghost guess ──────────────────────────────────────────────────────────────
export function processGhostGuess(
  state: GameState,
  guess: string
): GameState {
  const civilianWord = state.wordPair?.civilian?.toLowerCase().trim() ?? "";
  const correct = guess.toLowerCase().trim() === civilianWord;

  if (correct) {
    return { ...state, phase: "summary", winner: "ghost", ghostGuess: guess };
  }

  // Wrong guess — continue game
  const winner = checkWinCondition(state);
  if (winner) return { ...state, phase: "summary", winner };

  return nextRound({ ...state, ghostGuess: guess });
}

// ─── Create player ────────────────────────────────────────────────────────────
export function createPlayer(name: string, isHost = false): Player {
  return {
    id: nanoid(8),
    name,
    role: "civilian",
    word: null,
    isEliminated: false,
    isHost,
    clue: null,
    votes: 0,
    hasVoted: false,
    joinedAt: Date.now(),
  };
}
