"use client";
import { useEffect, useRef, useCallback } from "react";
import Ably from "ably";
import { AblyEvent, AblyEventType } from "./types";

let ablyClient: Ably.Realtime | null = null;

async function getAblyClient(): Promise<Ably.Realtime> {
  if (ablyClient) return ablyClient;
  const tokenRes = await fetch("/api/ably-token");
  const tokenData = await tokenRes.json();
  ablyClient = new Ably.Realtime({ token: tokenData.token });
  return ablyClient;
}

export function useAblyRoom(
  roomCode: string | null,
  onEvent: (event: AblyEvent) => void,
  playerId: string
) {
  const channelRef = useRef<Ably.RealtimeChannel | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!roomCode) return;
    let cancelled = false;

    (async () => {
      const client = await getAblyClient();
      if (cancelled) return;

      const channel = client.channels.get(`wordspy:${roomCode}`);
      channelRef.current = channel;

      channel.subscribe((msg) => {
        if (msg.data?.senderId === playerId) return; // ignore own events
        onEventRef.current(msg.data as AblyEvent);
      });
    })();

    return () => {
      cancelled = true;
      channelRef.current?.unsubscribe();
      channelRef.current = null;
    };
  }, [roomCode, playerId]);

  const publish = useCallback(
    async (type: AblyEventType, payload: unknown) => {
      if (!channelRef.current) return;
      const event: AblyEvent = {
        type,
        payload,
        senderId: playerId,
        timestamp: Date.now(),
      };
      await channelRef.current.publish("event", event);
    },
    [playerId]
  );

  return { publish };
}
