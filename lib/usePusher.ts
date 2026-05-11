"use client";
import { useEffect, useRef, useCallback } from "react";
import PusherClient from "pusher-js";
import { AblyEventType } from "./types";

let pusherClient: PusherClient | null = null;

function getPusherClient(): PusherClient {
  if (pusherClient) return pusherClient;
  pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  });
  return pusherClient;
}

export interface GameEvent {
  type: AblyEventType;
  payload: unknown;
  senderId: string;
  timestamp: number;
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
    const client = getPusherClient();
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
    async (type: AblyEventType, payload: unknown) => {
      const event: GameEvent = {
        type,
        payload,
        senderId: playerId,
        timestamp: Date.now(),
      };
      // Pusher requires server-side publishing
      await fetch("/api/pusher-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode, event }),
      });
    },
    [roomCode, playerId]
  );

  return { publish };
}
