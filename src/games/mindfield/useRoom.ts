"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { GameState } from "./types";

export function useMindFieldRoom(
  roomId: string | null,
  roomCode: string | null,
  onStateUpdate: (state: GameState) => void
) {
  const onUpdateRef = useRef(onStateUpdate);
  onUpdateRef.current = onStateUpdate;

  const [realtimeReady, setRealtimeReady] = useState(false);
  const lastEtagRef = useRef<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const stateRef = useRef<GameState | null>(null);

  const fetchState = useCallback(async () => {
    if (!roomCode) return;
    try {
      const headers: Record<string, string> = {};
      if (lastEtagRef.current) headers["If-None-Match"] = lastEtagRef.current;
      const res = await fetch(`/api/mindfield/rooms/${roomCode}/state`, { headers });
      if (res.status === 304) return;
      if (res.ok) {
        const etag = res.headers.get("etag");
        if (etag) lastEtagRef.current = etag;
        const data = await res.json();
        if (data.gameState) {
          stateRef.current = data.gameState;
          onUpdateRef.current(data.gameState);
        }
      }
    } catch {}
  }, [roomCode]);

  // Reset ETag when room changes
  useEffect(() => { lastEtagRef.current = null; }, [roomCode]);

  // Realtime subscription — fires fetchState on game_state change, receives flag broadcasts
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
        () => { fetchState(); }
      )
      .on("broadcast", { event: "flag_toggle" }, ({ payload }) => {
        const current = stateRef.current;
        if (!current) return;
        const flaggedTiles = (payload as { flaggedTiles: number[] }).flaggedTiles;
        const updated = { ...current, flaggedTiles };
        stateRef.current = updated;
        onUpdateRef.current(updated);
      })
      .subscribe((status) => {
        setRealtimeReady(status === "SUBSCRIBED");
      });

    channelRef.current = channel;

    return () => {
      setRealtimeReady(false);
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [roomId, fetchState]);

  // Polling fallback — only when Realtime is disconnected
  useEffect(() => {
    if (!roomCode || realtimeReady) return;
    const interval = setInterval(fetchState, 2000);
    return () => clearInterval(interval);
  }, [roomCode, realtimeReady, fetchState]);

  // Returns true if the optimistic state should be kept (server accepted OR conflict
  // already resynced via onUpdate). Returns false only on network/server errors where
  // the caller should revert its optimistic update.
  const pushState = useCallback(
    async (code: string, state: GameState): Promise<boolean> => {
      try {
        const res = await fetch(`/api/mindfield/rooms/${code}/state`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameState: state, roomId: roomId ?? undefined }),
        });
        if (res.status === 409) {
          const data = await res.json();
          if (data.current) {
            stateRef.current = data.current;
            onUpdateRef.current(data.current);
          }
          // Conflict was handled by syncing to server's current state — don't revert.
          return true;
        }
        if (res.ok) {
          const data = await res.json();
          if (data.gameState) {
            stateRef.current = data.gameState;
            onUpdateRef.current(data.gameState);
          }
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [roomId]
  );

  const sendFlagBroadcast = useCallback((flaggedTiles: number[]) => {
    channelRef.current?.send({
      type: "broadcast",
      event: "flag_toggle",
      payload: { flaggedTiles },
    });
  }, []);

  return { pushState, sendFlagBroadcast };
}
