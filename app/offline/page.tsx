"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store";
import {
  startGame, submitClue, castVote, processGhostGuess,
  nextRound, createInitialGameState, createPlayer,
} from "@/lib/gameEngine";
import { GameState, GameConfig } from "@/lib/types";
import { tokens, Btn, Card, SectionLabel, Toggle } from "@/components/ui";
import RulesModal from "@/components/game/RulesModal";
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
  const [nameError, setNameError] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);

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
      if (gameState.players.find((p) => p.name.toLowerCase() === newName.trim().toLowerCase())) {
        setNameError(`"${newName.trim()}" is already in the game. Pick a different name.`);
        return;
      }
      const player = createPlayer(newName.trim(), false);
      setGameState({ ...gameState, players: [...gameState.players, player] });
      setNewName("");
      setNameError(null);
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
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => setShowRules(true)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                border: `1.5px solid ${tokens.border}`,
                background: tokens.white,
                cursor: "pointer",
                fontSize: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s",
              }}
              title="Rules"
            >
              ❓
            </button>
            <div style={{ fontSize: 12, color: tokens.grey3 }}>Pass-phone mode</div>
          </div>
        </div>
        <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />

        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14, maxWidth: 480, margin: "0 auto" }}>
          {/* Players - moved first for better UX */}
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

          {/* Role Distribution */}
          <Card>
            <SectionLabel>Role Distribution</SectionLabel>
            {(() => {
              const total = gameState.players.length || 3;
              const undercovers = Math.min(config.undercoverCount, Math.max(1, total - 2));
              const ghosts = Math.min(config.ghostCount, Math.max(0, total - undercovers - 2));
              const civilians = total - undercovers - ghosts;
              const canAddUndercover = total - (undercovers + 1) - ghosts >= 2;
              const canAddGhost = total - undercovers - (ghosts + 1) >= 2;
              const stepperStyle = {
                width: 30, height: 30, borderRadius: 8,
                border: `1.5px solid ${tokens.border}`,
                background: tokens.white, cursor: "pointer",
                fontSize: 18, fontWeight: 600, color: tokens.grey1,
                display: "flex", alignItems: "center", justifyContent: "center",
              } as React.CSSProperties;
              const disabledStyle = { ...stepperStyle, opacity: 0.3, cursor: "not-allowed" };
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ padding: "4px 12px", borderRadius: 20, background: "#EDF6FF", color: "#2563EB", fontSize: 13, fontWeight: 600 }}>
                      👤 {civilians} civilian{civilians !== 1 ? "s" : ""}
                    </span>
                    <span style={{ padding: "4px 12px", borderRadius: 20, background: "#FFF3F0", color: tokens.coral, fontSize: 13, fontWeight: 600 }}>
                      🕵️ {undercovers} undercover{undercovers !== 1 ? "s" : ""}
                    </span>
                    {ghosts > 0 && (
                      <span style={{ padding: "4px 12px", borderRadius: 20, background: "#F3F0FF", color: "#7C3AED", fontSize: 13, fontWeight: 600 }}>
                        👻 {ghosts} ghost
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: tokens.black }}>Undercovers 🕵️</div>
                      <div style={{ fontSize: 12, color: tokens.grey3 }}>Know the other word, stay hidden</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <button style={undercovers <= 1 ? disabledStyle : stepperStyle} disabled={undercovers <= 1}
                        onClick={() => updateConfig({ undercoverCount: Math.max(1, undercovers - 1) })}>−</button>
                      <span style={{ fontSize: 16, fontWeight: 700, minWidth: 20, textAlign: "center", color: tokens.black }}>{undercovers}</span>
                      <button style={!canAddUndercover ? disabledStyle : stepperStyle} disabled={!canAddUndercover}
                        onClick={() => updateConfig({ undercoverCount: undercovers + 1 })}>+</button>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: tokens.black }}>Mr. White / Ghost 👻</div>
                      <div style={{ fontSize: 12, color: tokens.grey3 }}>Gets no word — must bluff blindly</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <button style={ghosts <= 0 ? disabledStyle : stepperStyle} disabled={ghosts <= 0}
                        onClick={() => updateConfig({ ghostCount: 0 })}>−</button>
                      <span style={{ fontSize: 16, fontWeight: 700, minWidth: 20, textAlign: "center", color: tokens.black }}>{ghosts}</span>
                      <button style={!canAddGhost ? disabledStyle : stepperStyle} disabled={!canAddGhost}
                        onClick={() => updateConfig({ ghostCount: 1 })}>+</button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </Card>

          {/* Options */}
          <Card>
            <SectionLabel>Game Options</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { key: "safeRound", label: "Safe Round", desc: "No elimination in round 1" },
                { key: "tieBreaker", label: "Tie Breaker", desc: "Tied players re-clue and revote" },
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
      const result = submitClue(gameState, currentPlayer.id, clue);
      if (result.error) {
        alert(result.error);
        return;
      }
      const allClued = result.state.players.filter((p) => !p.isEliminated).every((p) => p.clue !== null);
      setGameState(allClued ? { ...result.state, phase: "vote" } : result.state);
    };
    return (
      <CluePhase
        gameState={gameState}
        localPlayer={currentPlayer}
        isOffline={true}
        onSubmitClue={handleClue}
        onSendChat={() => {}}
        onStartVoting={() => setGameState({ ...gameState, phase: "vote" })}
      />
    );
  }

  // ─── Vote phase ───────────────────────────────────────────────────────────
  if (gameState.phase === "vote") {
    const activePlayers = gameState.players.filter((p) => !p.isEliminated);
    const currentVoter = activePlayers[gameState.currentVoterIndex];
    const handleVote = (targetId: string) => {
      setGameState(castVote(gameState, currentVoter.id, targetId, true));
    };
    return (
      <VotePhase
        gameState={gameState}
        localPlayer={currentVoter}
        isOffline={true}
        onVote={handleVote}
        onContinue={() => setGameState(nextRound(gameState))}
      />
    );
  }

  // ─── Elimination ──────────────────────────────────────────────────────────
  if (gameState.phase === "elimination") {
    return (
      <EliminationScreen
        gameState={gameState}
        localPlayer={localPlayer}
        isOffline={true}
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
        currentVoterIndex: 0,
      });
    };
    return <SummaryScreen gameState={gameState} localPlayer={localPlayer} onPlayAgain={handlePlayAgain} />;
  }

  return null;
}
