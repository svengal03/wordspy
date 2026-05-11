"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store";
import {
  startGame, submitClue, castVote, processGhostGuess,
  nextRound, createInitialGameState, createPlayer,
} from "@/lib/gameEngine";
import { GameState } from "@/lib/types";

import LobbySetup from "@/components/game/LobbySetup";
import RoleReveal from "@/components/game/RoleReveal";
import CluePhase from "@/components/game/CluePhase";
import VotePhase from "@/components/game/VotePhase";
import EliminationScreen from "@/components/game/EliminationScreen";
import SummaryScreen from "@/components/game/SummaryScreen";

export default function OfflinePage() {
  const router = useRouter();
  const {
    localPlayer, gameState, setGameState, config,
    revealIndex, setRevealIndex, reset,
  } = useGameStore();

  // Initialize offline game state
  useEffect(() => {
    if (!localPlayer) { router.push("/"); return; }
    if (!gameState) {
      const state = createInitialGameState("OFFLINE", config);
      // Add host as first player
      const withHost = { ...state, players: [{ ...localPlayer, isHost: true }] };
      setGameState(withHost);
    }
  }, []);

  const [additionalNames, setAdditionalNames] = useState<string[]>([]);
  const [newName, setNewName] = useState("");

  if (!gameState || !localPlayer) return null;

  // ─── Lobby (offline: add players by name) ──────────────────────────────────
  if (gameState.phase === "lobby") {
    function addPlayer() {
      if (!newName.trim()) return;
      if (gameState!.players.find((p) => p.name.toLowerCase() === newName.toLowerCase())) return;
      const player = createPlayer(newName.trim(), false);
      const updated = { ...gameState!, players: [...gameState!.players, player] };
      setGameState(updated);
      setNewName("");
    }

    function removePlayer(id: string) {
      if (id === localPlayer!.id) return;
      const updated = { ...gameState!, players: gameState!.players.filter((p) => p.id !== id) };
      setGameState(updated);
    }

    function handleStart() {
      const started = startGame({ ...gameState!, config });
      setGameState(started);
      setRevealIndex(0);
    }

    return (
      <div style={{
        minHeight: "100dvh", background: "#FAFAF8",
        fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
      }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #F0F0F0", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#1A1A1A" }}>📱 Offline Game</div>
          <div style={{ fontSize: 12, color: "#AAA" }}>Pass-phone mode</div>
        </div>

        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14, maxWidth: 480, margin: "0 auto" }}>

          {/* Player list */}
          <div style={{ background: "#fff", borderRadius: 20, padding: 20, border: "1.5px solid #F0F0F0", boxShadow: "0 2px 16px rgba(0,0,0,.05)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#AAA", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14 }}>
              Players ({gameState.players.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              {gameState.players.map((p) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "#F0EDE9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#888" }}>
                    {p.name[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>{p.name}</div>
                  {p.isHost && <span style={{ fontSize: 11, color: "#CC785C", fontWeight: 700 }}>HOST</span>}
                  {!p.isHost && (
                    <button onClick={() => removePlayer(p.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#CCC" }}>✕</button>
                  )}
                </div>
              ))}
            </div>

            {/* Add player */}
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addPlayer()}
                placeholder="Add player name…"
                maxLength={20}
                style={{
                  flex: 1, padding: "10px 13px", borderRadius: 10, border: "1.5px solid #F0F0F0",
                  fontSize: 14, fontFamily: "inherit", outline: "none", color: "#1A1A1A", background: "#FAFAFA",
                }}
              />
              <button onClick={addPlayer} style={{
                padding: "10px 18px", borderRadius: 10, background: "#CC785C", border: "none",
                color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}>Add</button>
            </div>
          </div>

          {/* Word pack selector */}
          <LobbySetup gameState={gameState} onStart={handleStart} onUpdateConfig={(cfg) => setGameState({ ...gameState, config: cfg })} />
        </div>
      </div>
    );
  }

  // ─── Role reveal (offline: pass phone to each player) ──────────────────────
  if (gameState.phase === "role-reveal") {
    const isLast = revealIndex >= gameState.players.length - 1;

    function handleRevealDone() {
      if (isLast) {
        setGameState({ ...gameState!, phase: "clue" });
      } else {
        setRevealIndex(revealIndex + 1);
      }
    }

    return (
      <RoleReveal
        gameState={gameState}
        localPlayer={gameState.players[revealIndex]}
        isOffline={true}
        revealIndex={revealIndex}
        onDone={handleRevealDone}
      />
    );
  }

  // ─── Clue phase ────────────────────────────────────────────────────────────
  if (gameState.phase === "clue" || gameState.phase === "discussion") {
    const currentPlayer = gameState.players[gameState.currentCluePlayerIndex];

    function handleClue(clue: string) {
      const updated = submitClue(gameState!, currentPlayer.id, clue);
      // After all clued in offline, move to vote
      const allClued = updated.players.filter(p => !p.isEliminated).every(p => p.clue !== null);
      setGameState(allClued ? { ...updated, phase: "vote" } : updated);
    }

    return (
      <CluePhase
        gameState={gameState}
        localPlayer={currentPlayer}
        isOffline={true}
        onSubmitClue={handleClue}
        onSendChat={() => {}}
      />
    );
  }

  // ─── Vote phase ────────────────────────────────────────────────────────────
  if (gameState.phase === "vote") {
    // In offline, we collect votes one at a time (host tallies)
    function handleVote(targetId: string) {
      const updated = castVote(gameState!, localPlayer!.id, targetId);
      setGameState(updated);
    }
    return (
      <VotePhase
        gameState={gameState}
        localPlayer={localPlayer}
        onVote={handleVote}
      />
    );
  }

  // ─── Elimination ───────────────────────────────────────────────────────────
  if (gameState.phase === "elimination") {
    function handleGhostGuess(guess: string) {
      setGameState(processGhostGuess(gameState!, guess));
    }
    function handleContinue() {
      setGameState(nextRound(gameState!));
    }
    return (
      <EliminationScreen
        gameState={gameState}
        localPlayer={localPlayer}
        onGhostGuess={handleGhostGuess}
        onContinue={handleContinue}
      />
    );
  }

  // ─── Summary ───────────────────────────────────────────────────────────────
  if (gameState.phase === "summary") {
    function handlePlayAgain() {
      const fresh = createInitialGameState("OFFLINE", config);
      const withPlayers = {
        ...fresh,
        players: gameState!.players.map((p) => ({
          ...p, role: "civilian" as const, word: null, isEliminated: false,
          clue: null, votes: 0, hasVoted: false,
        })),
      };
      setGameState(withPlayers);
    }
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
