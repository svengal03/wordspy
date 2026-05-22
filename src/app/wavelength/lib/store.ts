import { create } from "zustand";
import { persist } from "zustand/middleware";
import { GameState, DEFAULT_CONFIG, TeamId } from "./types";

const INITIAL_STATE: GameState = {
  phase: "setup",
  players: [],
  teams: [
    { id: "A", score: 0, psychicIndex: 0 },
    { id: "B", score: 0, psychicIndex: 0 },
  ],
  config: { ...DEFAULT_CONFIG },
  round: 0,
  currentTeamId: "A" as TeamId,
  currentPsychicId: null,
  currentCard: null,
  targetPosition: 50,
  clue: null,
  needlePosition: 50,
  opposingBet: null,
  lastResult: null,
  history: [],
  winner: null,
  usedCardIds: [],
};

interface GameStore {
  game: GameState;
  set: (partial: Partial<GameState>) => void;
  reset: () => void;
  restartGame: () => void;
}

export const useGame = create<GameStore>()(
  persist(
    (setState) => ({
      game: { ...INITIAL_STATE },
      set: (partial) => setState((s) => ({ game: { ...s.game, ...partial } })),
      reset: () => setState({ game: { ...INITIAL_STATE } }),
      // Keep the player list and config so SetupScreen can pre-fill names on next game
      restartGame: () => setState((s) => ({
        game: { ...INITIAL_STATE, players: s.game.players, config: s.game.config },
      })),
    }),
    { name: "wavelength-store",
      version: 1, // bumped — clears stale pre-fix data from localStorage
      // Persist full game state so accidental browser close can be resumed.
      // Reset only if the stored game was already finished.
      onRehydrateStorage: () => (state) => {
        if (state?.game.phase === "game-over") state.reset();
      },
    }
  )
);
