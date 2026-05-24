"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Btn, Card, SectionLabel, tokens, PlayHubLogo, OptionsMenu, Avatar } from "@playhub/ui";
import RulesModal from "./RulesModal";
import type { GameState, Player, TeamColor } from "../types";

interface Pack { id: string; name: string; emoji: string | null; }

interface Props {
  gameState: GameState;
  localPlayer: Player;
  onAssignTeam: (playerId: string, team: TeamColor | null) => void;
  onAssignSpymaster: (playerId: string) => void;
  onUpdatePackId: (packId: string) => void;
  onUpdateTargetWins: (n: number) => void;
  onStart: () => void;
  onRemovePlayer: (id: string) => void;
  onLeave: () => void;
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.3, ease: "easeOut" },
});

// Muted tones that fit the app's earthy palette
const TEAM = {
  red:  { top: "#C0504D", text: "#8B3330", label: "Red Team" },
  blue: { top: "#4A7FB5", text: "#2E5A8A", label: "Blue Team" },
} as const;

export default function LobbyScreen({
  gameState, localPlayer,
  onAssignTeam, onAssignSpymaster, onUpdatePackId, onUpdateTargetWins,
  onStart, onRemovePlayer, onLeave,
}: Props) {
  const isHost = localPlayer.isHost;
  const [copied, setCopied] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [packs, setPacks] = useState<Pack[]>([]);

  useEffect(() => {
    fetch("/api/packs?game=mindfield")
      .then(r => r.json())
      .then(d => setPacks(d.packs ?? []))
      .catch(() => {});
  }, []);

  function copyCode() {
    navigator.clipboard.writeText(gameState.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareLink() {
    const url = `${location.origin}/mindfield/room/${gameState.roomCode}`;
    if (navigator.share) {
      navigator.share({ title: "Join Mind Field", text: `Code: ${gameState.roomCode}`, url });
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const redPlayers  = gameState.players.filter(p => p.team === "red");
  const bluePlayers = gameState.players.filter(p => p.team === "blue");
  const unassigned  = gameState.players.filter(p => !p.team);
  const redHasSpy   = redPlayers.some(p => p.role === "spymaster");
  const blueHasSpy  = bluePlayers.some(p => p.role === "spymaster");

  // DEV: bypass team requirements
  const canStart = gameState.config.packId !== "";

  const startHints = [
    !gameState.config.packId && "Choose a word pack",
    (redPlayers.length < 2 || bluePlayers.length < 2) && "Each team needs at least 2 players",
    (!redHasSpy || !blueHasSpy) && "Each team needs a Spymaster",
  ].filter(Boolean) as string[];

  return (
    <div style={{ minHeight: "100dvh", background: tokens.bg, fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* TopBar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        padding: "12px 20px", background: tokens.bg,
        borderBottom: `1px solid ${tokens.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <PlayHubLogo appName="Mind Field" />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowRules(true)} style={navBtnStyle()}>Rules</button>
          <OptionsMenu onExit={onLeave} />
        </div>
      </div>

      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />

      <div style={{ padding: "20px 16px 40px", display: "flex", flexDirection: "column", gap: 16, maxWidth: 480, margin: "0 auto" }}>

        {/* Room Code */}
        <motion.div {...fadeUp(0)}>
          <Card style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Room Code</div>
                <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 5, color: tokens.coral, lineHeight: 1 }}>{gameState.roomCode}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={shareLink} style={navBtnStyle()}>Share</button>
                <button onClick={copyCode} style={{
                  ...navBtnStyle(),
                  background: copied ? "#F0FAF4" : tokens.white,
                  borderColor: copied ? "#16A34A40" : tokens.border,
                  color: copied ? tokens.green : tokens.grey1,
                }}>
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Teams */}
        <motion.div {...fadeUp(0.04)}>
          <Card style={{ padding: "14px 14px 14px" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, letterSpacing: 0.8, textTransform: "uppercase" }}>Pick a Team</div>
              <span style={{ fontSize: 12, color: tokens.grey3 }}>{gameState.players.length} in room</span>
            </div>

            {/* Unassigned */}
            {unassigned.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: tokens.grey3, fontWeight: 600, marginBottom: 6 }}>Not yet assigned</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {unassigned.map(p => (
                    <div key={p.id} style={{
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "4px 8px 4px 5px", borderRadius: 20,
                      background: tokens.bg, border: `1px solid ${tokens.border}`,
                    }}>
                      <Avatar name={p.name} size={18} color={tokens.grey3} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: tokens.grey1 }}>{p.name}</span>
                      {p.isHost && <span style={{ fontSize: 9, color: tokens.coral, fontWeight: 700 }}>HOST</span>}
                      {p.id === localPlayer.id && <span style={{ fontSize: 9, color: tokens.green, fontWeight: 700 }}>YOU</span>}
                      {isHost && !p.isHost && p.id !== localPlayer.id && (
                        <button onClick={() => onRemovePlayer(p.id)} style={{
                          border: "none", background: "none", cursor: "pointer",
                          fontSize: 12, color: tokens.grey4, lineHeight: 1, padding: 0,
                        }}>×</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Two columns */}
            <div style={{ display: "flex", gap: 8 }}>
              {(["red", "blue"] as TeamColor[]).map(team => {
                const players   = team === "red" ? redPlayers : bluePlayers;
                const other     = team === "red" ? "blue" : "red" as TeamColor;
                const c         = TEAM[team];
                const teamHasSpy = players.some(p => p.role === "spymaster");
                const imHere    = localPlayer.team === team;
                const imFree    = !localPlayer.team;

                return (
                  <div key={team} style={{
                    flex: 1, minWidth: 0,
                    borderRadius: 10,
                    border: `1px solid ${tokens.border}`,
                    background: tokens.white,
                    overflow: "hidden",
                  }}>
                    {/* Color stripe + header */}
                    <div style={{ borderTop: `3px solid ${c.top}`, padding: "10px 12px 8px" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: c.text }}>{c.label}</div>
                      <div style={{ fontSize: 10, color: tokens.grey3, marginTop: 1 }}>
                        {players.length} player{players.length !== 1 ? "s" : ""}
                        {teamHasSpy && <span style={{ color: c.top }}> · Spy ✓</span>}
                      </div>
                    </div>

                    <div style={{ height: 1, background: tokens.border }} />

                    {/* Players */}
                    <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
                      {players.length === 0 && (
                        <div style={{ fontSize: 11, color: tokens.grey4, textAlign: "center", padding: "8px 0" }}>Empty</div>
                      )}
                      <AnimatePresence>
                        {players.map(p => {
                          const isSpy = p.role === "spymaster";
                          const teamAlreadyHasSpy = teamHasSpy && !isSpy;
                          const canControl = p.id === localPlayer.id || isHost;

                          return (
                            <motion.div
                              key={p.id}
                              layout
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 4 }}
                            >
                              {/* Name row */}
                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: canControl ? 7 : 0 }}>
                                <Avatar name={p.name} size={24} color={c.top} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: tokens.black, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {p.name}
                                  </div>
                                  {isSpy && <div style={{ fontSize: 9, color: c.text, fontWeight: 700, letterSpacing: 0.3 }}>SPYMASTER</div>}
                                </div>
                                <div style={{ display: "flex", gap: 4, flexShrink: 0, alignItems: "center" }}>
                                  {p.isHost && <span style={{ fontSize: 8, color: tokens.coral, fontWeight: 700 }}>HOST</span>}
                                  {p.id === localPlayer.id && <span style={{ fontSize: 8, color: tokens.green, fontWeight: 700 }}>YOU</span>}
                                  {isHost && !p.isHost && p.id !== localPlayer.id && (
                                    <button onClick={() => onRemovePlayer(p.id)} style={{
                                      border: "none", background: "none", cursor: "pointer",
                                      fontSize: 14, color: tokens.grey4, lineHeight: 1, padding: "0 2px",
                                    }}>×</button>
                                  )}
                                </div>
                              </div>

                              {/* Controls */}
                              {canControl && (
                                <div style={{ display: "flex", gap: 5 }}>
                                  <button
                                    onClick={() => onAssignTeam(p.id, other)}
                                    style={smallBtn(false)}
                                  >
                                    Switch →
                                  </button>
                                  {isHost && (
                                    <button
                                      onClick={() => !teamAlreadyHasSpy && onAssignSpymaster(p.id)}
                                      disabled={teamAlreadyHasSpy}
                                      style={{
                                        ...smallBtn(isSpy),
                                        borderColor: isSpy ? c.top : teamAlreadyHasSpy ? tokens.border : tokens.border,
                                        color: isSpy ? c.top : teamAlreadyHasSpy ? tokens.grey4 : tokens.grey2,
                                        opacity: teamAlreadyHasSpy ? 0.45 : 1,
                                      }}
                                    >
                                      {isSpy ? "Spy ✓" : "Spy"}
                                    </button>
                                  )}
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>

                    {/* Join / Switch footer — for the local player */}
                    {(imFree || imHere) && (
                      <div style={{ padding: "0 12px 12px" }}>
                        <button
                          onClick={() => onAssignTeam(localPlayer.id, team)}
                          style={{
                            width: "100%", padding: "8px 0", borderRadius: 8, fontSize: 12, fontWeight: 700,
                            border: `1.5px solid ${c.top}`,
                            background: imFree ? c.top : "transparent",
                            color: imFree ? "#fff" : c.text,
                            cursor: "pointer", fontFamily: "inherit",
                          }}
                        >
                          {imFree ? `Join ${team === "red" ? "Red" : "Blue"}` : `Stay ${team === "red" ? "Red" : "Blue"}`}
                        </button>
                      </div>
                    )}
                    {!imFree && !imHere && (
                      <div style={{ padding: "0 12px 12px" }}>
                        <button
                          onClick={() => onAssignTeam(localPlayer.id, team)}
                          style={{
                            width: "100%", padding: "8px 0", borderRadius: 8, fontSize: 12, fontWeight: 700,
                            border: `1.5px solid ${c.top}`, background: "transparent",
                            color: c.text, cursor: "pointer", fontFamily: "inherit",
                          }}
                        >
                          Switch to {team === "red" ? "Red" : "Blue"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>

        {/* Word Pack — host only */}
        {isHost && (
          <motion.div {...fadeUp(0.08)}>
            <Card style={{ padding: "14px 16px" }}>
              <SectionLabel>Word Pack</SectionLabel>
              {packs.length === 0
                ? <div style={{ fontSize: 13, color: tokens.grey3 }}>Loading packs…</div>
                : <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {packs.map(pack => {
                      const sel = gameState.config.packId === pack.id;
                      return (
                        <button key={pack.id} onClick={() => onUpdatePackId(pack.id)} style={{
                          padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                          border: `1.5px solid ${sel ? tokens.coral : tokens.border}`,
                          background: sel ? tokens.coralBg : "transparent",
                          color: sel ? tokens.coral : tokens.grey1,
                          cursor: "pointer", fontFamily: "inherit",
                        }}>
                          {pack.emoji} {pack.name}
                        </button>
                      );
                    })}
                  </div>
              }
            </Card>
          </motion.div>
        )}

        {/* Rounds to Win — host only */}
        {isHost && (
          <motion.div {...fadeUp(0.1)}>
            <Card style={{ padding: "12px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: tokens.black }}>Rounds to Win</div>
                  <div style={{ fontSize: 11, color: tokens.grey3, marginTop: 2 }}>First to reach this many wins</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[1, 2, 3, 5].map(n => {
                    const sel = gameState.config.targetWins === n;
                    return (
                      <button key={n} onClick={() => onUpdateTargetWins(n)} style={{
                        width: 34, height: 34, borderRadius: 8,
                        border: `1.5px solid ${sel ? tokens.coral : tokens.border}`,
                        background: sel ? tokens.coralBg : tokens.white,
                        color: sel ? tokens.coral : tokens.grey2,
                        fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                      }}>{n}</button>
                    );
                  })}
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Start / Waiting */}
        {isHost ? (
          <motion.div {...fadeUp(0.12)} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {startHints[0] && (
              <div style={{ fontSize: 12, color: tokens.grey3, textAlign: "center" }}>{startHints[0]}</div>
            )}
            <Btn fullWidth onClick={onStart} disabled={!canStart} style={{ padding: 15, fontSize: 15 }}>
              Start Game →
            </Btn>
          </motion.div>
        ) : (
          <div style={{ textAlign: "center", color: tokens.grey3, fontSize: 13, padding: "4px 0" }}>
            Waiting for host to start…
          </div>
        )}

      </div>
    </div>
  );
}

function navBtnStyle(): React.CSSProperties {
  return {
    padding: "6px 12px", borderRadius: 8, border: `1px solid ${tokens.border}`,
    background: tokens.white, cursor: "pointer", fontSize: 12, fontWeight: 600,
    color: tokens.grey1, fontFamily: "inherit",
  };
}

function smallBtn(active: boolean): React.CSSProperties {
  return {
    flex: 1, padding: "5px 0", borderRadius: 7, fontSize: 11, fontWeight: 600,
    border: `1px solid ${active ? "currentColor" : tokens.border}`,
    background: "transparent", cursor: "pointer", color: tokens.grey2, fontFamily: "inherit",
  };
}
