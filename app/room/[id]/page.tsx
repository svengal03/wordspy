"use client";
import { useEffect, useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store";
import { usePusherRoom } from "@/lib/usePusher";
import { GameState, ChatMessage, GameEvent } from "@/lib/types";
import {
  startGame, submitClue, processGhostGuess,
  nextRound,
} from "@/lib/gameEngine";
import { nanoid } from "nanoid";

import LobbySetup from "@/components/game/LobbySetup";
import RoleReveal from "@/components/game/RoleReveal";
import CluePhase from "@/components/game/CluePhase";
import VotePhase from "@/components/game/VotePhase";
import EliminationScreen from "@/components/game/EliminationScreen";
import SummaryScreen from "@/components/game/SummaryScreen";

export default function RoomPage() {
  const params = useParams();
  const roomCode = params.id as string;
  const router = useRouter();
  const [roomError, setRoomError] = useState<string | null>(null);

  const {
    localPlayer, gameState, setGameState,
    setRoomCode, config,
  } = useGameStore();

  async function pushState(state: GameState) {
    setGameState(state);
    await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", roomCode, gameState: state }),
    });
  }

  const handleEvent = useCallback((event: GameEvent) => {
    switch (event.type) {
      case "game-state-update":
        setGameState(event.payload as GameState);
        break;
      case "player-joined": {
        const player = event.payload as NonNullable<typeof localPlayer>;
        // Use ref to avoid stale closure - re-fetch current state
        fetch("/api/rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "get", roomCode }),
        }).then(r => r.json()).then(data => {
          if (data.gameState) setGameState(data.gameState);
        });
        break;
      }
    }
  }, [setGameState]);

  const playerId = localPlayer?.id ?? "anon";
  const { publish } = usePusherRoom(roomCode, handleEvent, playerId);

  useEffect(() => {
    if (!roomCode) return;
    setRoomCode(roomCode);

    (async () => {
      try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get", roomCode }),
      });
      if (!res.ok) {
        setRoomError("Room not found — the session may have ended. Taking you home…");
        setTimeout(() => router.push("/"), 3000);
        return;
      }
      const data = await res.json();
      const state = data.gameState as GameState;

      if (localPlayer) {
        const alreadyIn = state.players.find((p) => p.id === localPlayer.id);
        if (!alreadyIn) {
          const updated = { ...state, players: [...state.players, localPlayer] };
          await pushState(updated);
          await publish("player-joined", localPlayer);
        } else {
          setGameState(state);
        }
      } else {
        setGameState(state);
      }
      } catch {
        setRoomError("Connection error — taking you home…");
        setTimeout(() => router.push("/"), 3000);
      }
    })();
  }, [roomCode]);

  async function handleStart() {
    if (!gameState) return;
    const started = startGame({ ...gameState, config });
    await pushState(started);
    await publish("game-state-update", started);
  }

  async function handleUpdateConfig(newConfig: typeof config) {
    if (!gameState) return;
    const updated = { ...gameState, config: newConfig };
    await pushState(updated);
    await publish("game-state-update", updated);
  }

  async function handleClue(clue: string) {
    if (!gameState || !localPlayer) return;
    const result = submitClue(gameState, localPlayer.id, clue);
    if (result.error) {
      alert(result.error);
      return;
    }
    await pushState(result.state);
    await publish("game-state-update", result.state);
  }

  async function handleVote(targetId: string) {
    if (!gameState || !localPlayer) return;
    // Server applies vote atomically to prevent race conditions from simultaneous votes
    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cast-vote", roomCode, voterId: localPlayer.id, targetId }),
    });
    if (!res.ok) return;
    const data = await res.json();
    const updated = data.gameState as GameState;
    setGameState(updated);
    await publish("game-state-update", updated);
  }

  async function handleGhostGuess(guess: string) {
    if (!gameState) return;
    const updated = processGhostGuess(gameState, guess);
    await pushState(updated);
    await publish("game-state-update", updated);
  }

  async function handleContinue() {
    if (!gameState) return;
    const updated = nextRound(gameState);
    await pushState(updated);
    await publish("game-state-update", updated);
  }

  async function handleChat(text: string) {
    if (!gameState || !localPlayer) return;
    const msg: ChatMessage = {
      id: nanoid(6),
      playerId: localPlayer.id,
      playerName: localPlayer.name,
      text,
      timestamp: Date.now(),
      type: "message",
    };
    const updated = { ...gameState, chat: [...gameState.chat, msg] };
    await pushState(updated);
    await publish("game-state-update", updated);
  }

  async function handlePlayAgain() {
    if (!gameState) return;
    const reset: GameState = {
      ...gameState,
      phase: "lobby",
      round: 0,
      players: gameState.players.map((p) => ({
        ...p, role: "civilian" as const, word: null, isEliminated: false,
        clue: null, votes: 0, hasVoted: false,
      })),
      wordPair: null,
      currentCluePlayerIndex: 0,
      currentVoterIndex: 0,
      eliminatedThisRound: null,
      ghostGuessAllowed: false,
      ghostGuess: null,
      winner: null,
      chat: [],
    };
    await pushState(reset);
    await publish("game-state-update", reset);
  }

  if (!gameState || !localPlayer) {
    return (
      <div style={{
        minHeight: "100dvh", display: "flex", alignItems: "center",
        justifyContent: "center", fontFamily: "system-ui",
        flexDirection: "column", gap: 12,
      }}>
        <div style={{ fontSize: 32 }}>{roomError ? "😔" : "🕵️"}</div>
        <div style={{ color: roomError ? "#EF4444" : "#888", textAlign: "center", maxWidth: 280, lineHeight: 1.5 }}>
          {roomError ?? "Loading room…"}
        </div>
      </div>
    );
  }

  const phase = gameState.phase;

  if (phase === "lobby") {
    return <LobbySetup gameState={gameState} onStart={handleStart} onUpdateConfig={handleUpdateConfig} />;
  }

  if (phase === "role-reveal") {
    return (
      <RoleReveal
        gameState={gameState}
        localPlayer={localPlayer}
        isOffline={false}
        revealIndex={0}
        onDone={async () => {
          const updated = { ...gameState, phase: "clue" as const };
          await pushState(updated);
          await publish("game-state-update", updated);
        }}
      />
    );
  }

  if (phase === "clue" || phase === "discussion") {
    return (
      <CluePhase
        gameState={gameState}
        localPlayer={localPlayer}
        isOffline={false}
        onSubmitClue={handleClue}
        onSendChat={handleChat}
        onStartVoting={async () => {
          const updated = { ...gameState, phase: "vote" as const };
          await pushState(updated);
          await publish("game-state-update", updated);
        }}
      />
    );
  }

  if (phase === "vote") {
    return (
      <VotePhase
        gameState={gameState}
        localPlayer={localPlayer}
        onVote={handleVote}
        onContinue={async () => {
          const updated = nextRound(gameState);
          await pushState(updated);
          await publish("game-state-update", updated);
        }}
      />
    );
  }

  if (phase === "elimination") {
    return <EliminationScreen gameState={gameState} localPlayer={localPlayer} onGhostGuess={handleGhostGuess} onContinue={handleContinue} />;
  }

  if (phase === "summary") {
    return <SummaryScreen gameState={gameState} localPlayer={localPlayer} onPlayAgain={handlePlayAgain} />;
  }

  return null;
}
