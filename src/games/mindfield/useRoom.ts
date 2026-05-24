"use client";
import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { GameState } from "./types";

export function useMindFieldRoom(
  roomId: string | null,
  roomCode: string | null,
  onStateUpdate: (state: GameState) => void
) {
  const onUpdateRef = useRef(onStateUpdate);
  onUpdateRef.current = onStateUpdate;

  // Realtime subscription
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`mindfield:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_state",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const row = payload.new as { payload: GameState };
          if (row?.payload) onUpdateRef.current(row.payload);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  // Polling fallback — catches updates that realtime might miss (e.g. table not enabled for realtime)
  useEffect(() => {
    if (!roomCode) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/mindfield/rooms/${roomCode}/state`);
        if (res.ok) {
          const data = await res.json();
          if (data.gameState) onUpdateRef.current(data.gameState);
        }
      } catch {}
    }, 4000);
    return () => clearInterval(interval);
  }, [roomCode]);

  const pushState = useCallback(
    async (roomCode: string, state: GameState): Promise<boolean> => {
      try {
        const res = await fetch(`/api/mindfield/rooms/${roomCode}/state`, {
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
