"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store";
import {
  startGame, submitClue, castVote, processGhostGuess,
  nextRound, createInitialGameState, createPlayer,
} from "@/lib/gameEngine";
import { GameState, GameConfig } from "@/lib/types";
import { tokens, Btn, Card, SectionLabel, Toggle } from "@/components/ui";
import { WORD_PACKS } from "@/lib/wordPacks";

import RoleReveal from "@/components/game/RoleReveal";
import CluePhase from "@/components/game/CluePhase";
import VotePhase from "@/components/game/VotePhase";
import EliminationScreen from "@/components/game/EliminationScreen";
import SummaryScreen from "@/components/game/SummaryScreen";

export default function OfflinePage() {
  const router = useRouter();
  const {
    localPlayer, gameState, setGameState, config, setConfig,
    revealIndex, setRevealIndex, reset,
  } = useGameStore();

  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (!localPlayer) { router.push("/"); return; }
    if (!gameState) {
      const state = createInitialGameState("OFFLINE", config);
      const withHost = { ...state, players: [{ ...localPlayer, isHost: true }] };
      setGameState(withHost);
    }
  }, []);

  if (!gameState || !localPlayer) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui", color: "#888" }}>
        Loading…
      </div>
    );
  }

  // ─── Lobby ────────────────────────────────────────────────────────────────
  if (gameState.phase === "lobby") {
    const addPlayer = () => {
      if (!newName.trim()) return;
      if (gameState.players.find((p) => p.name.toLowerCase() === newName.toLowerCase())) return;
      const player = createPlayer(newName.trim(), false);
      setGameState({ ...gameState, players: [...gameState.players, player] });
      setNewName("");
    };

    const removePlayer = (id: string) => {
      if (id === localPlayer.id) return;
      setGameState({ ...gameState, players: gameState.players.filter((p) => p.id !== id) });
    };

    const handleStart = () => {
      const started = startGame({ ...gameState, config });
      setGameState(started);
      setRevealIndex(0);
    };

    const updateConfig = (partial: Partial<GameConfig>) => {
      setConfig(partial);
    };

    return (
      <div style={{ minHeight: "100dvh", background: tokens.bg, fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${tokens.border}`, background: tokens.white, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: tokens.black }}>📱 Offline Game</div>
          <div style={{ fontSize: 12, color: tokens.grey3 }}>Pass-phone mode</div>
        </div>

        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14, maxWidth: 480, margin: "0 auto" }}>
          {/* Players */}
          <Card>
            <SectionLabel>Players ({gameState.players.length})</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              {gameState.players.map((p) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "#F0EDE9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: tokens.grey2 }}>
                    {p.name[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: tokens.black }}>{p.name}</div>
                  {p.isHost && <span style={{ fontSize: 11, color: tokens.coral, fontWeight: 700 }}>HOST</span>}
                  {!p.isHost && (
                    <button onClick={() => removePlayer(p.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: tokens.grey4 }}>✕</button>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addPlayer()}
                placeholder="Add player name…"
                maxLength={20}
                style={{ flex: 1, padding: "10px 13px", borderRadius: 10, border: `1.5px solid ${tokens.border}`, fontSize: 14, fontFamily: "inherit", outline: "none", color: tokens.black, background: "#FAFAFA" }}
              />
              <button onClick={addPlayer} style={{ padding: "10px 18px", borderRadius: 10, background: tokens.coral, border: "none", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Add
              </button>
            </div>
          </Card>

          {/* Word Pack */}
          <Card>
            <SectionLabel>Word Pack</SectionLabel>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {WORD_PACKS.map((pack) => (
                <button key={pack.id} onClick={() => updateConfig({ packId: pack.id })} style={{
                  padding: "7px 12px", borderRadius: 10, fontSize: 13, fontWeight: 500,
                  border: `1.5px solid ${config.packId === pack.id ? tokens.coral : tokens.border}`,
                  background: config.packId === pack.id ? tokens.coralBg : "transparent",
                  color: config.packId === pack.id ? tokens.coral : tokens.grey1, cursor: "pointer",
                }}>
                  {pack.emoji} {pack.name}
                </button>
              ))}
            </div>
          </Card>

          {/* Options */}
          <Card>
            <SectionLabel>Game Options</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { key: "safeRound", label: "Safe Round", desc: "No elimination in round 1" },
                { key: "tieBreaker", label: "Tie Breaker", desc: "Tied players re-clue and revote" },
                { key: "ghostEnabled", label: "Ghost Role", desc: "One player gets no word" },
              ].map((opt) => (
                <div key={opt.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: tokens.black }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: tokens.grey3 }}>{opt.desc}</div>
                  </div>
                  <Toggle
                    value={config[opt.key as keyof GameConfig] as boolean}
                    onChange={(v) => updateConfig({ [opt.key]: v })}
                  />
                </div>
              ))}
            </div>
          </Card>

          <Btn fullWidth onClick={handleStart} disabled={gameState.players.length < 3} style={{ padding: "16px", fontSize: 16 }}>
            {gameState.players.length < 3 ? `Need ${3 - gameState.players.length} more player(s)` : "Start Game →"}
          </Btn>
        </div>
      </div>
    );
  }

  // ─── Role reveal ──────────────────────────────────────────────────────────
  if (gameState.phase === "role-reveal") {
    const isLast = revealIndex >= gameState.players.length - 1;
    const handleRevealDone = () => {
      if (isLast) {
        setGameState({ ...gameState, phase: "clue" });
      } else {
        setRevealIndex(revealIndex + 1);
      }
    };
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

  // ─── Clue phase ───────────────────────────────────────────────────────────
  if (gameState.phase === "clue" || gameState.phase === "discussion") {
    const currentPlayer = gameState.players[gameState.currentCluePlayerIndex];
    const handleClue = (clue: string) => {
      const updated = submitClue(gameState, currentPlayer.id, clue);
      const allClued = updated.players.filter((p) => !p.isEliminated).every((p) => p.clue !== null);
      setGameState(allClued ? { ...updated, phase: "vote" } : updated);
    };
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

  // ─── Vote phase ───────────────────────────────────────────────────────────
  if (gameState.phase === "vote") {
    const handleVote = (targetId: string) => {
      setGameState(castVote(gameState, localPlayer.id, targetId));
    };
    return <VotePhase gameState={gameState} localPlayer={localPlayer} onVote={handleVote} />;
  }

  // ─── Elimination ──────────────────────────────────────────────────────────
  if (gameState.phase === "elimination") {
    return (
      <EliminationScreen
        gameState={gameState}
        localPlayer={localPlayer}
        onGhostGuess={(guess) => setGameState(processGhostGuess(gameState, guess))}
        onContinue={() => setGameState(nextRound(gameState))}
      />
    );
  }

  // ─── Summary ──────────────────────────────────────────────────────────────
  if (gameState.phase === "summary") {
    const handlePlayAgain = () => {
      const fresh = createInitialGameState("OFFLINE", config);
      setGameState({
        ...fresh,
        players: gameState.players.map((p) => ({
          ...p, role: "civilian" as const, word: null, isEliminated: false,
          clue: null, votes: 0, hasVoted: false,
        })),
      });
    };
    return <SummaryScreen gameState={gameState} localPlayer={localPlayer} onPlayAgain={handlePlayAgain} />;
  }

  return null;
}
