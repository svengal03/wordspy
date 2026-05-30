import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GameState, Player, GameConfig } from "./types";
import { DEFAULT_CONFIG } from "./types";

interface MindFieldStore {
  localPlayer: Player | null;
  setLocalPlayer: (p: Player) => void;

  roomCode: string | null;
  setRoomCode: (code: string) => void;

  gameState: GameState | null;
  setGameState: (state: GameState) => void;

  config: GameConfig;
  setConfig: (c: Partial<GameConfig>) => void;

  reset: () => void;
}

export const useMindFieldStore = create<MindFieldStore>()(
  persist(
    (set) => ({
      localPlayer: null,
      setLocalPlayer: (p) => set({ localPlayer: p }),

      roomCode: null,
      setRoomCode: (code) => set({ roomCode: code }),

      gameState: null,
      setGameState: (state) => set({ gameState: state }),

      config: { ...DEFAULT_CONFIG },
      setConfig: (c) => set((s) => ({ config: { ...s.config, ...c } })),

      reset: () =>
        set({
          localPlayer: null,
          roomCode: null,
          gameState: null,
          config: { ...DEFAULT_CONFIG },
        }),
    }),
    {
      name: "mindfield-store",
      partialize: (s) => ({ localPlayer: s.localPlayer, roomCode: s.roomCode }),
    }
  )
);
