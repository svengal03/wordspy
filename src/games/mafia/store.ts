import { create } from "zustand";
import { persist } from "zustand/middleware";
import { GameState, GameConfig, DEFAULT_CONFIG } from "./types";

const INITIAL_STATE: GameState = {
  phase: "setup",
  nightSubPhase: "sleeping",
  round: 0,
  players: [],
  config: { ...DEFAULT_CONFIG },
  nightActions: { mafiaTarget: null, doctorTarget: null, policeTarget: null, doctorLastTarget: null },
  nominatedPlayerId: null,
  voteYes: 0,
  voteNo: 0,
  lastNightResult: null,
  eliminationHistory: [],
  roundHistory: [],
  winner: null,
  revealIndex: 0,
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
    {
      name: "mafia-store",
      version: 1, // bumped — clears stale pre-fix data from localStorage
      // Persist full game state so accidental browser close can be resumed.
      // Reset only if the stored game was already finished.
      onRehydrateStorage: () => (state) => {
        if (state?.game.phase === "game-over") state.reset();
      },
    }
  )
);
