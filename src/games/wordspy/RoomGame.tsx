"use client";
import { useEffect, useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGameStore } from "@/games/wordspy/store";
import { useSupabaseRoom } from "@/games/wordspy/useRoom";
import { GameState, ChatMessage } from "@/games/wordspy/types";
import {
  startGame, submitClue, processGhostGuess,
  nextRound, eliminatePlayer,
} from "@/games/wordspy/engine";
import { nanoid } from "nanoid";

import LobbySetup from "@/games/wordspy/components/LobbySetup";
import RoleReveal from "@/games/wordspy/components/RoleReveal";
import CluePhase from "@/games/wordspy/components/CluePhase";
import VotePhase from "@/games/wordspy/components/VotePhase";
import EliminationScreen from "@/games/wordspy/components/EliminationScreen";
import SummaryScreen from "@/games/wordspy/components/SummaryScreen";
import ChatPanel from "@/games/wordspy/components/ChatPanel";

export function WordspyRoom() {
  const params = useParams();
  const roomCode = params.id as string;
  const router = useRouter();
  const [roomError, setRoomError] = useState<string | null>(null);
  // Supabase room UUID — needed for the Realtime subscription
  const [roomId, setRoomId] = useState<string | null>(null);

  const {
    localPlayer, gameState, setGameState,
    setRoomCode, setLocalPlayer, config, reset,
  } = useGameStore();

  // ── Supabase Realtime subscription ──────────────────────────────────────────
  // Replaces Pusher: the hook listens for postgres_changes on game_state
  // and calls setGameState whenever another player pushes a state update.
  const { pushState } = useSupabaseRoom(roomId, setGameState);

  // ── pushState wrapper ────────────────────────────────────────────────────────
  // Optimistically updates local state first then persists to Supabase.
  async function push(state: GameState) {
    const prev = gameState;
    setGameState(state);
    const ok = await pushState(roomCode, state);
    if (!ok && prev) setGameState(prev);
  }

  useEffect(() => {
    if (!roomCode) return;
    setRoomCode(roomCode);

    (async () => {
      try {
        // Fetch state via new GET endpoint and capture the Supabase room UUID
        const res = await fetch(`/api/rooms/${roomCode}/state`);
        if (!res.ok) {
          setRoomError("Room not found — the session may have ended. Taking you home…");
          setTimeout(() => router.push("/wordspy"), 3000);
          return;
        }
        const data = await res.json();
        const state = data.gameState as GameState;
        setRoomId(data.roomId);   // store UUID for Supabase Realtime subscription

      if (localPlayer) {
        const alreadyIn = state.players.find((p) => p.id === localPlayer.id);
        if (!alreadyIn) {
          // Block joining a game that's already started
          if (state.phase !== "lobby") {
            setRoomError("This game is already in progress — you can't join mid-game.");
            setTimeout(() => router.push("/wordspy"), 3000);
            return;
          }
          // Rejoin: if same name exists, reuse that player entry
          const sameNamePlayer = state.players.find(
            (p) => p.name.toLowerCase() === localPlayer.name.toLowerCase()
          );
          if (sameNamePlayer) {
            setLocalPlayer(sameNamePlayer);
            setGameState(state);
          } else {
            const updated = { ...state, players: [...state.players, localPlayer] };
            await push(updated);
          }
        } else {
          setGameState(state);
        }
      } else {
        setGameState(state);
      }
      } catch {
        setRoomError("Connection error — taking you home…");
        setTimeout(() => router.push("/wordspy"), 3000);
      }
    })();
  }, [roomCode]);

  async function handleStart() {
    if (!gameState) return;
    const started = startGame({ ...gameState, config });
    await push(started);
  }

  async function handleUpdateConfig(newConfig: typeof config) {
    if (!gameState) return;
    const updated = { ...gameState, config: newConfig };
    await push(updated);
  }

  async function handleClue(clue: string) {
    if (!gameState || !localPlayer) return;
    const result = submitClue(gameState, localPlayer.id, clue);
    if (result.error) return result.error;
    await push(result.state);
  }

  async function handleVote(targetId: string) {
    if (!gameState || !localPlayer) return;
    try {
      // Server applies vote atomically to prevent race conditions from simultaneous votes
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cast-vote", roomCode, voterId: localPlayer.id, targetId }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.error) return;
      setGameState(data.gameState as GameState);
      // Supabase Realtime already broadcasts to others via the server-side updateState()
    } catch {
      // network error — vote not registered, user can retry
    }
  }

  async function handleGhostGuess(guess: string) {
    if (!gameState) return;
    const updated = processGhostGuess(gameState, guess);
    await push(updated);
  }

  async function handleContinue() {
    if (!gameState) return;
    const updated = nextRound(gameState);
    await push(updated);
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
    await push(updated);
  }

  async function handleRemovePlayer(playerId: string) {
    if (!gameState) return;
    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove-player", roomCode, playerId }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setGameState(data.gameState as GameState);
    // Supabase Realtime broadcasts the update to other players
  }

  async function handleLeave() {
    if (!localPlayer) return;
    const msg = localPlayer.isHost ? "End game and return home?" : "Leave this game?";
    if (!window.confirm(msg)) return;
    await handleRemovePlayer(localPlayer.id);
    reset();
    router.push("/wordspy");
  }

  async function handlePlayAgain() {
    if (!gameState) return;
    const freshState: GameState = {
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
      isTiebreaker: false,
      chat: [],
    };
    await push(freshState);
  }

  const isKicked = gameState && localPlayer &&
    gameState.phase === "lobby" &&
    !gameState.players.find((p) => p.id === localPlayer.id);

  if (!gameState || !localPlayer || isKicked) {
    const msg = isKicked
      ? "You were removed from the room by the host."
      : roomError ?? "Loading room…";
    return (
      <div style={{
        minHeight: "100dvh", display: "flex", alignItems: "center",
        justifyContent: "center", fontFamily: "system-ui",
        flexDirection: "column", gap: 12,
      }}>
        <div style={{ fontSize: 32 }}>{(isKicked || roomError) ? "😔" : "🕵️"}</div>
        <div style={{ color: (isKicked || roomError) ? "#EF4444" : "#888", textAlign: "center", maxWidth: 280, lineHeight: 1.5 }}>
          {msg}
        </div>
        {isKicked && (
          <>
            <div style={{ fontSize: 13, color: "#AAA", marginTop: 4 }}>
              Room <strong style={{ color: "#555" }}>{roomCode}</strong> — ask the host to re-invite you.
            </div>
            <button
              onClick={() => router.push("/")}
              style={{ marginTop: 8, padding: "10px 20px", borderRadius: 10, border: "1.5px solid #E5E0DC", background: "white", cursor: "pointer", fontSize: 14 }}
            >
              Back to Home
            </button>
          </>
        )}
      </div>
    );
  }

  const phase = gameState.phase;

  if (phase === "lobby") {
    return <LobbySetup gameState={gameState} onStart={handleStart} onUpdateConfig={handleUpdateConfig} onRemovePlayer={handleRemovePlayer} onLeave={handleLeave} />;
  }

  if (phase === "role-reveal") {
    return (
      <RoleReveal
        gameState={gameState}
        localPlayer={localPlayer}
        isOffline={false}
        revealIndex={0}
        onLeave={handleLeave}
        onNewGame={localPlayer.isHost ? handlePlayAgain : undefined}
        onDone={async () => {
          const updated = { ...gameState, phase: "clue" as const };
          await push(updated);
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
        onLeave={handleLeave}
        onNewGame={localPlayer.isHost ? handlePlayAgain : undefined}
        onStartVoting={async () => {
          const updated = { ...gameState, phase: "vote" as const };
          await push(updated);
        }}
      />
    );
  }

  if (phase === "vote") {
    return (
      <div>
        <VotePhase
          gameState={gameState}
          localPlayer={localPlayer}
          onVote={handleVote}
          onLeave={handleLeave}
          onNewGame={localPlayer.isHost ? handlePlayAgain : undefined}
          onContinue={async () => {
            const updated = nextRound(gameState);
            await push(updated);
          }}
        />
        <div style={{ padding: "0 20px 32px", maxWidth: 480, margin: "0 auto" }}>
          <ChatPanel messages={gameState.chat} localPlayer={localPlayer} onSend={handleChat} />
        </div>
      </div>
    );
  }

  if (phase === "host-pick") {
    const activePlayers = gameState.players.filter((p) => !p.isEliminated);
    if (activePlayers.length === 0) {
      push({ ...gameState, phase: "summary", winner: "civilians" });
      return null;
    }
    const maxVotes = Math.max(...activePlayers.map((p) => p.votes));
    const tiedPlayers = activePlayers.filter((p) => p.votes === maxVotes);
    const isHost = localPlayer.isHost;
    return (
      <div style={{
        minHeight: "100dvh", background: "#FAFAF8",
        fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid #F0F0F0", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#AAA", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>Final Elimination</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#1A1A1A", letterSpacing: -0.5 }}>Votes are tied</div>
            <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>
              {isHost ? "Choose who is eliminated" : "Waiting for host to decide…"}
            </div>
          </div>
          <button onClick={handleLeave} style={{ padding: "7px 14px", borderRadius: 10, border: "1.5px solid #E5E0DC", background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#888", fontFamily: "inherit" }}>
            Leave
          </button>
        </div>
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 12, maxWidth: 480, margin: "0 auto", width: "100%" }}>
          {tiedPlayers.map((p) => (
            <button
              key={p.id}
              disabled={!isHost}
              onClick={async () => {
                if (!isHost) return;
                const updated = eliminatePlayer(gameState, p.id);
                await push(updated);
              }}
              style={{
                display: "flex", alignItems: "center", gap: 14, padding: "16px 18px",
                borderRadius: 16, border: "1.5px solid #CC785C30",
                background: isHost ? "#fff" : "#FAFAFA",
                cursor: isHost ? "pointer" : "default", textAlign: "left",
                boxShadow: "0 2px 12px rgba(0,0,0,0.05)", width: "100%",
                opacity: isHost ? 1 : 0.7,
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: "#FFF8F5",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 700, color: "#CC785C", flexShrink: 0,
              }}>{p.name.slice(0, 2).toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A" }}>{p.name}</div>
                <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>{p.votes} vote{p.votes !== 1 ? "s" : ""}</div>
              </div>
              {isHost && <div style={{ fontSize: 13, fontWeight: 600, color: "#CC785C" }}>Eliminate →</div>}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (phase === "elimination") {
    return (
      <div>
        <EliminationScreen
          gameState={gameState}
          localPlayer={localPlayer}
          onGhostGuess={handleGhostGuess}
          onContinue={handleContinue}
          onLeave={handleLeave}
          onNewGame={localPlayer.isHost ? handlePlayAgain : undefined}
        />
        <div style={{ padding: "0 20px 32px", maxWidth: 480, margin: "0 auto" }}>
          <ChatPanel messages={gameState.chat} localPlayer={localPlayer} onSend={handleChat} />
        </div>
      </div>
    );
  }

  if (phase === "summary") {
    return (
      <div>
        <SummaryScreen gameState={gameState} localPlayer={localPlayer} onPlayAgain={handlePlayAgain} />
        <div style={{ padding: "0 20px 32px", maxWidth: 480, margin: "0 auto" }}>
          <ChatPanel messages={gameState.chat} localPlayer={localPlayer} onSend={handleChat} />
        </div>
      </div>
    );
  }

  return null;
}
