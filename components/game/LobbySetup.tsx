"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, Btn, SectionLabel, Toggle, tokens, Logo } from "@/components/ui";
import RulesModal from "./RulesModal";
import { WORD_PACKS } from "@/lib/wordPacks";
import { GameConfig, GameState } from "@/lib/types";
import { useGameStore } from "@/lib/store";

interface Props {
  gameState: GameState;
  onStart: () => void;
  onUpdateConfig: (config: GameConfig) => void;
}

export default function LobbySetup({ gameState, onStart, onUpdateConfig }: Props) {
  const { localPlayer, config, setConfig } = useGameStore();
  const isHost = localPlayer?.isHost;
  const [copied, setCopied] = useState(false);
  const [showRules, setShowRules] = useState(false);

  function update(partial: Partial<GameConfig>) {
    const next = { ...config, ...partial };
    setConfig(partial);
    onUpdateConfig(next);
  }

  function copyCode() {
    navigator.clipboard.writeText(gameState.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyLink() {
    const link = `${typeof window !== "undefined" ? window.location.origin : ""}/join/${gameState.roomCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareLink() {
    const link = `${typeof window !== "undefined" ? window.location.origin : ""}/join/${gameState.roomCode}`;
    if (navigator.share) {
      navigator.share({
        title: "Join my Wordspy game",
        text: `Use code ${gameState.roomCode}`,
        url: link,
      });
    }
  }

  return (
    <div style={{
      minHeight: "100dvh", background: tokens.bg,
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Top bar */}
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${tokens.border}`, background: tokens.white, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Logo />
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
          <div style={{ fontSize: 12, color: tokens.grey3 }}>
            {isHost ? "You are host" : "Waiting for host"}
          </div>
        </div>
      </div>
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />

      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16, maxWidth: 480, margin: "0 auto" }}>

        {/* Room code */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <SectionLabel>Room Code — Share this</SectionLabel>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: 6, color: tokens.coral }}>
                {gameState.roomCode}
              </div>
              <Btn variant="ghost" onClick={copyCode} style={{ padding: "8px 16px", fontSize: 13 }}>
                {copied ? "✅" : "Copy 📋"}
              </Btn>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Btn variant="ghost" onClick={copyLink} style={{ flex: 1, padding: "8px 12px", fontSize: 12 }}>
                Copy Link
              </Btn>
              {'share' in navigator && (
                <Btn variant="ghost" onClick={shareLink} style={{ flex: 1, padding: "8px 12px", fontSize: 12 }}>
                  Share →
                </Btn>
              )}
            </div>
            <div style={{ fontSize: 13, color: tokens.grey3, marginTop: 8 }}>
              Friends join at wordspy.vercel.app with this code
            </div>
          </Card>
        </motion.div>

        {/* Players */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <SectionLabel>Players ({gameState.players.length}/{config.playerCount})</SectionLabel>
            {gameState.players.length === 0 ? (
              <div style={{ color: tokens.grey3, fontSize: 14, padding: "8px 0" }}>Waiting for players to join…</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {gameState.players.map((p) => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, background: "#F0EDE9",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16, fontWeight: 700, color: tokens.grey2,
                    }}>{p.name[0].toUpperCase()}</div>
                    <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: tokens.black }}>{p.name}</div>
                    {p.isHost && <span style={{ fontSize: 11, color: tokens.coral, fontWeight: 700 }}>HOST</span>}
                    {p.id === localPlayer?.id && <span style={{ fontSize: 11, color: tokens.green, fontWeight: 700 }}>YOU</span>}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Config — host only */}
        {isHost && (
          <>
            {/* Word Pack */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <SectionLabel>Word Pack</SectionLabel>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {WORD_PACKS.map((pack) => (
                    <button
                      key={pack.id}
                      onClick={() => update({ packId: pack.id })}
                      style={{
                        padding: "7px 14px", borderRadius: 10, fontSize: 13, fontWeight: 500,
                        border: `1.5px solid ${config.packId === pack.id ? tokens.coral : tokens.border}`,
                        background: config.packId === pack.id ? tokens.coralBg : "transparent",
                        color: config.packId === pack.id ? tokens.coral : tokens.grey1,
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                      }}
                    >
                      {pack.emoji} {pack.name}
                    </button>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Role Distribution */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card>
                <SectionLabel>Role Distribution</SectionLabel>
                {(() => {
                  const total = gameState.players.length || 5;
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
                      {/* Preview pill row */}
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
                      {/* Undercover stepper */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: tokens.black }}>Undercovers 🕵️</div>
                          <div style={{ fontSize: 12, color: tokens.grey3 }}>Know the other word, stay hidden</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <button style={undercovers <= 1 ? disabledStyle : stepperStyle} disabled={undercovers <= 1}
                            onClick={() => update({ undercoverCount: Math.max(1, undercovers - 1) })}>−</button>
                          <span style={{ fontSize: 16, fontWeight: 700, minWidth: 20, textAlign: "center", color: tokens.black }}>{undercovers}</span>
                          <button style={!canAddUndercover ? disabledStyle : stepperStyle} disabled={!canAddUndercover}
                            onClick={() => update({ undercoverCount: undercovers + 1 })}>+</button>
                        </div>
                      </div>
                      {/* Ghost stepper */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: tokens.black }}>Mr. White / Ghost 👻</div>
                          <div style={{ fontSize: 12, color: tokens.grey3 }}>Gets no word — must bluff blindly</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <button style={ghosts <= 0 ? disabledStyle : stepperStyle} disabled={ghosts <= 0}
                            onClick={() => update({ ghostCount: 0 })}>−</button>
                          <span style={{ fontSize: 16, fontWeight: 700, minWidth: 20, textAlign: "center", color: tokens.black }}>{ghosts}</span>
                          <button style={!canAddGhost ? disabledStyle : stepperStyle} disabled={!canAddGhost}
                            onClick={() => update({ ghostCount: 1 })}>+</button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </Card>
            </motion.div>

            {/* Host Options */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <SectionLabel>Host Options</SectionLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {[
                    { key: "safeRound", label: "Safe Round", desc: "No elimination in round 1 — just clues" },
                    { key: "tieBreaker", label: "Tie Breaker", desc: "Tied players re-clue and group revotes" },
                    { key: "jurySystem", label: "Jury System", desc: "Eliminated players cast a collective vote in the final round" },
                  ].map((opt) => (
                    <div key={opt.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: tokens.black }}>{opt.label}</div>
                        <div style={{ fontSize: 12, color: tokens.grey3, marginTop: 2 }}>{opt.desc}</div>
                      </div>
                      <Toggle
                        value={config[opt.key as keyof GameConfig] as boolean}
                        onChange={(v) => update({ [opt.key]: v })}
                      />
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>

            <Btn
              fullWidth
              onClick={onStart}
              disabled={gameState.players.length < 3}
              style={{ padding: "16px", fontSize: 16 }}
            >
              {gameState.players.length < 3
                ? `Need ${3 - gameState.players.length} more player(s)`
                : "Start Game →"}
            </Btn>
          </>
        )}

        {!isHost && (
          <div style={{ textAlign: "center", color: tokens.grey3, fontSize: 14, padding: "8px 0" }}>
            ⏳ Waiting for the host to start the game…
          </div>
        )}
      </div>
    </div>
  );
}
