"use client";
import { useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useGameStore } from "@/lib/store";
import { useAblyRoom } from "@/lib/useAbly";
import { AblyEvent, GameState, ChatMessage } from "@/lib/types";
import {
  startGame, submitClue, castVote, processGhostGuess,
  nextRound, createPlayer,
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

  const {
    localPlayer, gameState, setGameState, setLocalPlayer,
    setRoomCode, config,
  } = useGameStore();

  // Sync game state with server
  async function pushState(state: GameState) {
    setGameState(state);
    await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", roomCode, gameState: state }),
    });
  }

  // Handle incoming Ably events from other players
  const handleEvent = useCallback((event: AblyEvent) => {
    switch (event.type) {
      case "game-state-update":
        setGameState(event.payload as GameState);
        break;
      case "player-joined": {
        const player = event.payload as typeof localPlayer;
        setGameState((prev: GameState | null) => {
          if (!prev) return prev;
          if (prev.players.find((p) => p.id === player?.id)) return prev;
          return { ...prev, players: [...prev.players, player!] };
        } as any);
        break;
      }
    }
  }, [setGameState]);

  const playerId = localPlayer?.id ?? "anon";
  const { publish } = useAblyRoom(roomCode, handleEvent, playerId);

  // Fetch room state on mount & register player
  useEffect(() => {
    if (!roomCode) return;
    setRoomCode(roomCode);

    (async () => {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get", roomCode }),
      });
      if (!res.ok) return;
      const data = await res.json();
      const state = data.gameState as GameState;

      // If player doesn't exist yet, create and add
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
    })();
  }, [roomCode]);

  // ─── Host actions ──────────────────────────────────────────────────────────
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
    const updated = submitClue(gameState, localPlayer.id, clue);
    await pushState(updated);
    await publish("game-state-update", updated);
  }

  async function handleVote(targetId: string) {
    if (!gameState || !localPlayer) return;
    const updated = castVote(gameState, localPlayer.id, targetId);
    await pushState(updated);
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
        ...p, role: "civilian", word: null, isEliminated: false,
        clue: null, votes: 0, hasVoted: false,
      })),
      wordPair: null,
      currentCluePlayerIndex: 0,
      eliminatedThisRound: null,
      ghostGuessAllowed: false,
      ghostGuess: null,
      winner: null,
      chat: [],
    };
    await pushState(reset);
    await publish("game-state-update", reset);
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  if (!gameState || !localPlayer) {
    return (
      <div style={{
        minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "system-ui", color: "#888",
      }}>
        Loading room…
      </div>
    );
  }

  const phase = gameState.phase;

  if (phase === "lobby") {
    return (
      <LobbySetup
        gameState={gameState}
        onStart={handleStart}
        onUpdateConfig={handleUpdateConfig}
      />
    );
  }

  if (phase === "role-reveal") {
    return (
      <RoleReveal
        gameState={gameState}
        localPlayer={localPlayer}
        isOffline={false}
        revealIndex={0}
        onDone={() => {
          const updated = { ...gameState, phase: "clue" as const };
          pushState(updated);
          publish("game-state-update", updated);
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
      />
    );
  }

  if (phase === "vote") {
    return (
      <VotePhase
        gameState={gameState}
        localPlayer={localPlayer}
        onVote={handleVote}
      />
    );
  }

  if (phase === "elimination") {
    return (
      <EliminationScreen
        gameState={gameState}
        localPlayer={localPlayer}
        onGhostGuess={handleGhostGuess}
        onContinue={handleContinue}
      />
    );
  }

  if (phase === "summary") {
    return (
      <SummaryScreen
        gameState={gameState}
        localPlayer={localPlayer}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  return null;
}
