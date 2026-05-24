import { nanoid } from "nanoid";
import { shuffle } from "@/lib/array";
import type {
  GameState, Player, GamePhase, TeamColor, TileColor,
  RoundRecord, GameConfig, Tile,
} from "./types";
import { DEFAULT_CONFIG } from "./types";

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function createPlayer(name: string, isHost = false): Player {
  return {
    id: nanoid(8),
    name,
    team: null,
    role: null,
    isHost,
    joinedAt: Date.now(),
  };
}

export function createInitialState(roomCode: string, config: GameConfig = DEFAULT_CONFIG): GameState {
  return {
    roomCode,
    phase: "lobby",
    players: [],
    config,
    tiles: [],
    currentTeam: "red",
    turnPhase: "giving-clue",
    clue: null,
    clueNumber: null,
    guessesRemaining: 0,
    bigClueUsedRed: false,
    bigClueUsedBlue: false,
    roundWinner: null,
    bombTriggeredBy: null,
    redWins: 0,
    blueWins: 0,
    redPoints: 0,
    bluePoints: 0,
    winner: null,
    roundHistory: [],
    round: 0,
    createdAt: Date.now(),
  };
}

export function assignTiles(words: string[]): Tile[] {
  if (words.length < 25) throw new Error("Need at least 25 words");
  const selected = shuffle(words).slice(0, 25);
  const colors: TileColor[] = [
    ...Array(9).fill("red"),
    ...Array(8).fill("blue"),
    ...Array(7).fill("neutral"),
    "bomb",
  ];
  const shuffledColors = shuffle(colors);
  return selected.map((word, i) => ({ id: i, word, color: shuffledColors[i], revealed: false }));
}

export function validateClue(clue: string, tiles: Tile[]): string | null {
  const c = clue.trim().toLowerCase();
  if (!c) return "Enter a clue word";
  if (c.includes(" ")) return "One word only — no spaces";
  const gridWords = tiles.map(t => t.word.toLowerCase());
  if (gridWords.includes(c)) return "Clue cannot be a word on the grid";
  return null;
}

export function submitClue(state: GameState, clue: string, clueNumber: number): GameState {
  const isBig = clueNumber >= 3;
  return {
    ...state,
    clue,
    clueNumber,
    guessesRemaining: clueNumber + 1,
    turnPhase: "guessing",
    bigClueUsedRed: state.bigClueUsedRed || (state.currentTeam === "red" && isBig),
    bigClueUsedBlue: state.bigClueUsedBlue || (state.currentTeam === "blue" && isBig),
  };
}

export function endTurn(state: GameState): GameState {
  const nextTeam: TeamColor = state.currentTeam === "red" ? "blue" : "red";
  return {
    ...state,
    currentTeam: nextTeam,
    turnPhase: "giving-clue",
    clue: null,
    clueNumber: null,
    guessesRemaining: 0,
  };
}

function allRevealed(state: GameState, team: TeamColor): boolean {
  return state.tiles.filter(t => t.color === team).every(t => t.revealed);
}

function getRoundWinner(state: GameState): TeamColor | null {
  if (allRevealed(state, "red")) return "red";
  if (allRevealed(state, "blue")) return "blue";
  return null;
}

function applyRoundEnd(state: GameState, bombTriggered: boolean): GameState {
  const winner: TeamColor = bombTriggered
    ? (state.bombTriggeredBy === "red" ? "blue" : "red")
    : getRoundWinner(state)!;

  let redDelta = 0;
  let blueDelta = 0;

  if (bombTriggered) {
    if (winner === "red") { redDelta = 800; blueDelta = -300; }
    else { blueDelta = 800; redDelta = -300; }
  } else {
    const winnerUsedBigClue = winner === "red" ? state.bigClueUsedRed : state.bigClueUsedBlue;
    const pts = 500 + (winnerUsedBigClue ? 200 : 0);
    if (winner === "red") redDelta = pts;
    else blueDelta = pts;
  }

  const redWins = state.redWins + (winner === "red" ? 1 : 0);
  const blueWins = state.blueWins + (winner === "blue" ? 1 : 0);
  const winnerUsedBigClue = !bombTriggered && (winner === "red" ? state.bigClueUsedRed : state.bigClueUsedBlue);

  const record: RoundRecord = {
    round: state.round,
    winner,
    bombTriggered,
    bombTriggeredBy: state.bombTriggeredBy,
    winnerUsedBigClue,
    redPointsEarned: redDelta,
    bluePointsEarned: blueDelta,
  };

  let gameWinner: TeamColor | null = null;
  let phase: GamePhase = "round-over";
  if (redWins >= state.config.targetWins) { gameWinner = "red"; phase = "game-over"; }
  else if (blueWins >= state.config.targetWins) { gameWinner = "blue"; phase = "game-over"; }

  return {
    ...state,
    phase,
    roundWinner: winner,
    winner: gameWinner,
    redWins,
    blueWins,
    redPoints: state.redPoints + redDelta,
    bluePoints: state.bluePoints + blueDelta,
    roundHistory: [...state.roundHistory, record],
  };
}

export function revealTile(state: GameState, tileId: number): GameState {
  const idx = state.tiles.findIndex(t => t.id === tileId);
  if (idx === -1 || state.tiles[idx].revealed) return state;

  const tile = state.tiles[idx];
  const tiles = state.tiles.map((t, i) => i === idx ? { ...t, revealed: true } : t);
  let s = { ...state, tiles };

  if (tile.color === "bomb") {
    s = { ...s, bombTriggeredBy: state.currentTeam };
    return applyRoundEnd(s, true);
  }

  if (tile.color === state.currentTeam) {
    s = { ...s, guessesRemaining: state.guessesRemaining - 1 };
    const roundWin = getRoundWinner(s);
    if (roundWin) return applyRoundEnd(s, false);
    if (s.guessesRemaining <= 0) return endTurn(s);
    return s;
  }

  // Opponent color or neutral — turn ends; check if opponent wins from this reveal
  const roundWin = getRoundWinner(s);
  if (roundWin) return applyRoundEnd(s, false);
  return endTurn(s);
}

export function startNextRound(state: GameState, newTiles: Tile[]): GameState {
  return {
    ...state,
    phase: "playing",
    tiles: newTiles,
    round: state.round + 1,
    currentTeam: "red",
    turnPhase: "giving-clue",
    clue: null,
    clueNumber: null,
    guessesRemaining: 0,
    bigClueUsedRed: false,
    bigClueUsedBlue: false,
    roundWinner: null,
    bombTriggeredBy: null,
  };
}

export function resetForPlayAgain(state: GameState): GameState {
  return {
    ...createInitialState(state.roomCode, state.config),
    players: state.players.map(p => ({
      ...p,
      team: null,
      role: null,
    })),
    createdAt: state.createdAt,
  };
}
