import { create } from "zustand";
import { persist } from "zustand/middleware";
import { GameState, DEFAULT_CONFIG, TeamId } from "./types";

const INITIAL_STATE: GameState = {
  phase: "lobby",
  hostName: "",
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
      restartGame: () => setState((s) => ({
        game: { ...INITIAL_STATE, phase: "setup", hostName: s.game.hostName, players: s.game.players, config: s.game.config },
      })),
    }),
    { name: "wavelength-store",
      version: 3,
      migrate: (persisted: unknown, fromVersion: number) => {
        // Wipe any state from before v3 — old packId was a slug, not a UUID
        if (fromVersion < 3) return { game: { ...INITIAL_STATE } };
        const s = persisted as { game: GameState };
        // Also fix any lingering slug-style packId at runtime
        if (s?.game?.config?.packId && !s.game.config.packId.includes("-") === false) {
          const looksLikeUuid = /^[0-9a-f-]{36}$/i.test(s.game.config.packId);
          if (!looksLikeUuid) s.game.config.packId = "";
        }
        return s;
      },
      // Persist full game state so accidental browser close can be resumed.
      // Reset only if the stored game was already finished.
      onRehydrateStorage: () => (state) => {
        if (state?.game.phase === "game-over") state.reset();
      },
    }
  )
);
