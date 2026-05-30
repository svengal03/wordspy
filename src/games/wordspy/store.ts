import { create } from "zustand";
import { persist } from "zustand/middleware";
import { GameState, Player, GameConfig } from "./types";
import { DEFAULT_CONFIG } from "./types";

interface GameStore {
  // Local player identity
  localPlayer: Player | null;
  setLocalPlayer: (p: Player) => void;

  // Room
  roomCode: string | null;
  setRoomCode: (code: string) => void;

  // Full game state (synced via Supabase)
  gameState: GameState | null;
  setGameState: (state: GameState) => void;
  updateGameState: (partial: Partial<GameState>) => void;

  // Config (host only)
  config: GameConfig;
  setConfig: (c: Partial<GameConfig>) => void;

  // Offline mode flag
  isOffline: boolean;
  setOffline: (v: boolean) => void;

  // UI: which player is currently revealing (offline pass-phone)
  revealIndex: number;
  setRevealIndex: (i: number) => void;

  reset: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      localPlayer: null,
      setLocalPlayer: (p) => set({ localPlayer: p }),

      roomCode: null,
      setRoomCode: (code) => set({ roomCode: code }),

      gameState: null,
      setGameState: (state) => set({ gameState: state }),
      updateGameState: (partial) =>
        set((s) =>
          s.gameState ? { gameState: { ...s.gameState, ...partial } } : s
        ),

      config: { ...DEFAULT_CONFIG },
      setConfig: (c) => set((s) => ({ config: { ...s.config, ...c } })),

      isOffline: false,
      setOffline: (v) => set({ isOffline: v }),

      revealIndex: 0,
      setRevealIndex: (i) => set({ revealIndex: i }),

      reset: () =>
        set({
          localPlayer: null,
          roomCode: null,
          gameState: null,
          config: { ...DEFAULT_CONFIG },
          isOffline: false,
          revealIndex: 0,
        }),
    }),
    {
      name: "wordspy-store",
      partialize: (state) => ({
        localPlayer: state.localPlayer,
        roomCode: state.roomCode,
      }),
    }
  )
);
