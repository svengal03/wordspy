"use client";
import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { GameState } from "./types";

/**
 * useSupabaseRoom
 *
 * Replaces usePusher.ts.
 * Subscribes to postgres_changes on game_state for the given roomId.
 * When the server writes a new game state (via any API route → updateState()),
 * Supabase Realtime broadcasts the UPDATE and onStateUpdate is called.
 *
 * @param roomId   - UUID of the room (not the 6-char code)
 * @param onStateUpdate - called whenever game_state.payload changes
 */
export function useSupabaseRoom(
  roomId: string | null,
  onStateUpdate: (state: GameState) => void
) {
  const onUpdateRef = useRef(onStateUpdate);
  onUpdateRef.current = onStateUpdate;

  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_state",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          // payload.new is the updated game_state row
          const newRow = payload.new as { payload: GameState };
          if (newRow?.payload) {
            onUpdateRef.current(newRow.payload);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  /**
   * pushState
   * Writes the new game state via the API route.
   * The API route calls updateState() → triggers the DB trigger → Supabase
   * Realtime broadcasts to all other subscribers automatically.
   */
  const pushState = useCallback(
    async (roomCode: string, state: GameState): Promise<boolean> => {
      try {
        const res = await fetch(`/wordspy/api/rooms/${roomCode}/state`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameState: state }),
        });
        return res.ok;
      } catch {
        return false;
      }
    },
    []
  );

  return { pushState };
}
