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
  winner: null,
  revealIndex: 0,
};

interface GameStore {
  game: GameState;
  set: (partial: Partial<GameState>) => void;
  reset: () => void;
}

export const useGame = create<GameStore>()(
  persist(
    (setState) => ({
      game: { ...INITIAL_STATE },
      set: (partial) => setState((s) => ({ game: { ...s.game, ...partial } })),
      reset: () => setState({ game: { ...INITIAL_STATE } }),
    }),
    {
      name: "mafia-store",
    }
  )
);
