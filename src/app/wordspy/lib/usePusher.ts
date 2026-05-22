"use client";
import { useEffect, useRef, useCallback } from "react";
import PusherClient from "pusher-js";
import { GameEventType, GameEvent } from "./types";

let pusherClient: PusherClient | null = null;

function getPusherClient(): PusherClient {
  if (pusherClient) return pusherClient;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
  if (!key || !cluster) {
    throw new Error("Missing required env vars: NEXT_PUBLIC_PUSHER_KEY and NEXT_PUBLIC_PUSHER_CLUSTER");
  }
  pusherClient = new PusherClient(key, { cluster });
  return pusherClient;
}

export function usePusherRoom(
  roomCode: string | null,
  onEvent: (event: GameEvent) => void,
  playerId: string
) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const channelRef = useRef<ReturnType<PusherClient["subscribe"]> | null>(null);

  useEffect(() => {
    if (!roomCode) return;
    let client: PusherClient;
    try {
      client = getPusherClient();
    } catch (err) {
      console.error("[usePusher] Failed to initialise Pusher client:", err);
      return;
    }
    const channel = client.subscribe(`wordspy-${roomCode}`);
    channelRef.current = channel;

    channel.bind("game-event", (data: GameEvent) => {
      if (data.senderId === playerId) return; // ignore own events
      onEventRef.current(data);
    });

    return () => {
      channel.unbind_all();
      client.unsubscribe(`wordspy-${roomCode}`);
      channelRef.current = null;
    };
  }, [roomCode, playerId]);

  const publish = useCallback(
    async (type: GameEventType, payload: unknown): Promise<boolean> => {
      const event: GameEvent = {
        type,
        payload,
        senderId: playerId,
        timestamp: Date.now(),
      };
      try {
        const res = await fetch("/wordspy/api/pusher-event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomCode, event }),
        });
        return res.ok;
      } catch {
        return false;
      }
    },
    [roomCode, playerId]
  );

  return { publish };
}
