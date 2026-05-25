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
      .subscribe((status) => {
        setRealtimeReady(status === "SUBSCRIBED");
      });

    return () => {
      setRealtimeReady(false);
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  // Reset ETag when room changes so we don't suppress a valid first fetch
  useEffect(() => {
    lastEtagRef.current = null;
  }, [roomCode]);

  // Polling fallback — only active when Realtime is not connected
  useEffect(() => {
    if (!roomCode || realtimeReady) return;
    const interval = setInterval(async () => {
      try {
        const headers: Record<string, string> = {};
        if (lastEtagRef.current) headers["If-None-Match"] = lastEtagRef.current;
        const res = await fetch(`/api/mindfield/rooms/${roomCode}/state`, { headers });
        if (res.status === 304) return;
        if (res.ok) {
          const etag = res.headers.get("etag");
          if (etag) lastEtagRef.current = etag;
          const data = await res.json();
          if (data.gameState) onUpdateRef.current(data.gameState);
        }
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, [roomCode, realtimeReady]);

  const pushState = useCallback(
    async (roomCode: string, state: GameState): Promise<boolean> => {
      try {
        const res = await fetch(`/api/mindfield/rooms/${roomCode}/state`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameState: state, roomId: roomId ?? undefined }),
        });
        return res.ok;
      } catch {
        return false;
      }
    },
    [roomId]
  );

  return { pushState };
}
