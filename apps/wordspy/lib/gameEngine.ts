import { GameState, Player, Role, GameConfig } from "./types";
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
  config: GameConfig,
  pair?: { civilian: string; undercover: string }
): { players: Player[]; pair: { civilian: string; undercover: string } } {
  const wordPair = pair || getRandomPair(config.packId);

  // Clamp config values to valid range for actual player count
  const undercovers = Math.min(config.undercoverCount, Math.max(1, players.length - 2));
  const ghosts = Math.min(config.ghostCount, Math.max(0, players.length - undercovers - 2));
  const civilians = players.length - undercovers - ghosts;

  // Build role pool
  const roles: Role[] = [
    ...Array(undercovers).fill("undercover"),
    ...Array(ghosts).fill("ghost"),
    ...Array(civilians).fill("civilian"),
  ];

  // Shuffle roles
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }

  // Shuffle players so role assignment isn't biased by join order
  const shuffledPlayers = [...players];
  for (let i = shuffledPlayers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledPlayers[i], shuffledPlayers[j]] = [shuffledPlayers[j], shuffledPlayers[i]];
  }

  const assignedPlayers = shuffledPlayers.map((player, i) => ({
    ...player,
    role: roles[i],
    word:
      roles[i] === "civilian"
        ? wordPair.civilian
        : roles[i] === "undercover"
        ? wordPair.undercover
        : null,
    clue: null,
    votes: 0,
    hasVoted: false,
    isEliminated: false,
  }));

  return { players: assignedPlayers, pair: wordPair };
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
    currentVoterIndex: 0,
    eliminatedThisRound: null,
    ghostGuessAllowed: false,
    ghostGuess: null,
    winner: null,
    isTiebreaker: false,
    chat: [],
    createdAt: Date.now(),
  };
}

// ─── Start game ───────────────────────────────────────────────────────────────
export function startGame(state: GameState): GameState {
  const { players: assignedPlayers, pair } = assignRoles(state.players, state.config);
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

// ─── Check duplicate clues ────────────────────────────────────────────────────
export function isDuplicateClue(
  state: GameState,
  playerId: string,
  newClue: string
): boolean {
  const activeClues = state.players
    .filter((p) => !p.isEliminated && p.id !== playerId && p.clue)
    .map((p) => p.clue!.toLowerCase().trim());

  return activeClues.includes(newClue.toLowerCase().trim());
}

// ─── Submit clue ──────────────────────────────────────────────────────────────
export function submitClue(
  state: GameState,
  playerId: string,
  clue: string
): { state: GameState; error?: string } {
  // Check for duplicate clue in current round
  if (isDuplicateClue(state, playerId, clue)) {
    return { state, error: "That clue was already used! Try another one." };
  }

  const players = state.players.map((p) =>
    p.id === playerId ? { ...p, clue } : p
  );

  // Find next active player who still needs to give a clue (skip eliminated + already-clued)
  const activePlayers = players.filter((p) => !p.isEliminated);
  let nextIdx = state.currentCluePlayerIndex;
  let found = false;
  for (let i = 0; i < players.length; i++) {
    nextIdx = (state.currentCluePlayerIndex + 1 + i) % players.length;
    if (!players[nextIdx].isEliminated && !players[nextIdx].clue) {
      found = true;
      break;
    }
  }
  if (!found) nextIdx = state.currentCluePlayerIndex;

  // Check if all active players have given clues
  const allClued = activePlayers.every((p) => p.clue !== null);

  return {
    state: {
      ...state,
      players,
      currentCluePlayerIndex: nextIdx,
      phase: allClued ? "discussion" : "clue",
    },
  };
}

// ─── Cast vote ────────────────────────────────────────────────────────────────
export function castVote(
  state: GameState,
  voterId: string,
  targetId: string,
  isOffline: boolean = false
): GameState {
  const players = state.players.map((p) => {
    if (p.id === voterId) return { ...p, hasVoted: true };
    if (p.id === targetId) return { ...p, votes: p.votes + 1 };
    return p;
  });

  const activePlayers = players.filter((p) => !p.isEliminated);
  const allVoted = activePlayers.every((p) => p.hasVoted);

  // In offline mode, advance to next voter
  let nextState = { ...state, players };
  if (isOffline) {
    const activePlayers = players.filter((p) => !p.isEliminated);
    let nextVoterIdx = state.currentVoterIndex;
    for (let i = 0; i < activePlayers.length; i++) {
      nextVoterIdx = (nextVoterIdx + 1) % activePlayers.length;
      if (!activePlayers[nextVoterIdx].hasVoted) break;
    }
    nextState = { ...nextState, currentVoterIndex: nextVoterIdx };
  }

  if (!allVoted) return nextState;

  // Tally votes
  return processVotes(nextState);
}

// ─── Process votes & eliminate ────────────────────────────────────────────────
function processVotes(state: GameState): GameState {
  const activePlayers = state.players.filter((p) => !p.isEliminated);
  const maxVotes = Math.max(...activePlayers.map((p) => p.votes));
  const topVoted = activePlayers.filter((p) => p.votes === maxVotes);

  // Tie and tiebreaker enabled → go back to clue phase with tied players only
  if (topVoted.length > 1 && state.config.tieBreaker) {
    const players = state.players.map((p) => {
      const isTied = !!topVoted.find((tv) => tv.id === p.id);
      if (isTied) return { ...p, votes: 0, hasVoted: false, clue: null };
      // Reset all active players so the whole group can revote
      if (!p.isEliminated) return { ...p, votes: 0, hasVoted: false };
      return p;
    });
    const firstTiedIdx = players.findIndex((p) => topVoted[0].id === p.id);
    return { ...state, players, phase: "clue", currentCluePlayerIndex: firstTiedIdx, currentVoterIndex: 0, isTiebreaker: true };
  }

  // Tie but no tiebreaker → host picks who to eliminate
  if (topVoted.length > 1) {
    return { ...state, phase: "host-pick" };
  }

  // Eliminate player with most votes
  const eliminated = topVoted[0];
  const players = state.players.map((p) =>
    p.id === eliminated.id ? { ...p, isEliminated: true } : p
  );

  return {
    ...state,
    players,
    phase: "elimination",
    eliminatedThisRound: eliminated.id,
    ghostGuessAllowed: eliminated.role === "ghost",
  };
}

// ─── Host manually eliminates a tied player ───────────────────────────────────
export function eliminatePlayer(state: GameState, playerId: string): GameState {
  const target = state.players.find((p) => p.id === playerId);
  if (!target) return state;
  const players = state.players.map((p) =>
    p.id === playerId ? { ...p, isEliminated: true } : p
  );
  return {
    ...state,
    players,
    phase: "elimination",
    eliminatedThisRound: playerId,
    ghostGuessAllowed: target.role === "ghost",
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

  // All undercovers AND ghosts eliminated → civilians win
  if (undercovers.length === 0 && ghosts.length === 0) return "civilians";

  // Undercovers equal or outnumber civilians + ghosts → they control the vote and win
  if (undercovers.length >= civilians.length + ghosts.length) return "undercover";

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
    currentVoterIndex: 0,
    eliminatedThisRound: null,
    ghostGuessAllowed: false,
    ghostGuess: null,
    isTiebreaker: false,
  };
}

// ─── Ghost guess ──────────────────────────────────────────────────────────────
export function processGhostGuess(
  state: GameState,
  guess: string
): GameState {
  const normalizeText = (text: string) =>
    text.toLowerCase().trim().replace(/\s+/g, " ");

  const civilianWord = normalizeText(state.wordPair?.civilian ?? "");
  const correct = normalizeText(guess) === civilianWord;

  if (correct) {
    return { ...state, phase: "summary", winner: "ghost", ghostGuess: guess };
  }

  // Wrong guess — ghost already eliminated, game continues without them
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
