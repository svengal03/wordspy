"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Btn, Card, Toggle, tokens } from "@/components/ui";
import { useGame } from "@/lib/store";
import { createPlayer, assignRoles, getMafiaCount } from "@/lib/gameEngine";
import { DEFAULT_CONFIG, GameConfig } from "@/lib/types";
import RoleReveal from "@/components/game/RoleReveal";
import NightScreen from "@/components/game/NightScreen";
import DayScreen from "@/components/game/DayScreen";
import VoteScreen from "@/components/game/VoteScreen";
import GameOverScreen from "@/components/game/GameOverScreen";
import RulesModal from "@/components/game/RulesModal";

export default function MafiaApp() {
  const { game, set, reset } = useGame();

  // ─── Phase switcher ───────────────────────────────────────────────────────
  if (game.phase === "role-reveal") return <RoleReveal />;
  if (game.phase === "night") return <NightScreen />;
  if (game.phase === "day") return <DayScreen />;
  if (game.phase === "vote") return <VoteScreen />;
  if (game.phase === "game-over") return <GameOverScreen onPlayAgain={() => { reset(); }} />;

  // ─── Elimination result overlay (triggered from VoteScreen/NightScreen) ──
  // handled inside those components

  // ─── Setup screen ─────────────────────────────────────────────────────────
  return <SetupScreen />;
}

// ─── Setup screen ─────────────────────────────────────────────────────────────
function SetupScreen() {
  const { set, reset } = useGame();
  const [names, setNames] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [config, setConfigState] = useState<GameConfig>({ ...DEFAULT_CONFIG });
  const [error, setError] = useState("");
  const [showRules, setShowRules] = useState(false);

  function addPlayer() {
    const name = input.trim();
    if (!name) return;
    if (names.length >= 15) return setError("Maximum 15 players");
    if (names.some((n) => n.toLowerCase() === name.toLowerCase())) return setError("Name already taken");
    setNames([...names, name]);
    setInput("");
    setError("");
  }

  function removePlayer(i: number) {
    setNames(names.filter((_, idx) => idx !== i));
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") addPlayer();
  }

  function startGame() {
    if (names.length < 5) return setError("Need at least 5 players");
    const players = names.map((n) => createPlayer(n));
    const withRoles = assignRoles(players, config);
    set({
      phase: "role-reveal",
      round: 1,
      players: withRoles,
      config,
      revealIndex: 0,
      nightActions: { mafiaTarget: null, doctorTarget: null, policeTarget: null, doctorLastTarget: null },
      nominatedPlayerId: null,
      voteYes: 0,
      voteNo: 0,
      lastNightResult: null,
      eliminationHistory: [],
      winner: null,
    });
  }

  const count = names.length;
  // 1 god always assigned; mafiaCount based on playing players (count - 1)
  const playingCount = Math.max(count - 1, 4);
  const mafiaCount = getMafiaCount(playingCount);
  const specialCount = (config.doctorEnabled ? 1 : 0) + (config.policeEnabled ? 1 : 0);
  const villagerCount = Math.max(0, playingCount - mafiaCount - specialCount);

  return (
    <div style={{
      minHeight: "100dvh", background: tokens.bg,
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
      paddingBottom: 40,
    }}>
      {/* Header */}
      <div style={{
        padding: "18px 20px 16px", borderBottom: `1px solid ${tokens.border}`,
        background: tokens.white, display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: tokens.black, letterSpacing: -0.5 }}>
          Mafia<span style={{ color: tokens.red }}>.</span>
        </div>
        <button
          onClick={() => setShowRules(true)}
          style={{
            padding: "7px 14px", borderRadius: 10,
            border: `1.5px solid ${tokens.border}`,
            background: tokens.white, cursor: "pointer",
            fontSize: 13, fontWeight: 600, color: tokens.grey1,
            fontFamily: "inherit",
          }}
        >Rules</button>
      </div>

      <div style={{ padding: "20px", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Player entry */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 12 }}>
              Players ({count}/15)
            </div>

            {/* Name list */}
            {names.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                <AnimatePresence>
                  {names.map((name, i) => (
                    <motion.div
                      key={name}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <div style={{
                        width: 30, height: 30, borderRadius: 8, background: "#F0EDE9",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: 700, color: tokens.grey2, flexShrink: 0,
                      }}>{name[0].toUpperCase()}</div>
                      <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: tokens.black }}>{name}</div>
                      <button
                        onClick={() => removePlayer(i)}
                        style={{
                          width: 28, height: 28, borderRadius: 7,
                          border: `1px solid ${tokens.border}`, background: "transparent",
                          cursor: "pointer", fontSize: 14, color: tokens.grey3,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >×</button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Input */}
            {count < 15 && (
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={input}
                  onChange={(e) => { setInput(e.target.value); setError(""); }}
                  onKeyDown={handleKey}
                  placeholder="Add player…"
                  maxLength={20}
                  autoFocus
                  style={{
                    flex: 1, padding: "10px 12px", borderRadius: 10,
                    border: `1.5px solid ${tokens.border}`, fontSize: 14,
                    fontFamily: "inherit", background: "#FAFAFA", outline: "none", color: tokens.black,
                  }}
                />
                <Btn onClick={addPlayer} style={{ padding: "10px 16px", fontSize: 14 }}>
                  Add
                </Btn>
              </div>
            )}

            {error && (
              <div style={{ marginTop: 8, fontSize: 13, color: tokens.red }}>{error}</div>
            )}
          </Card>
        </motion.div>

        {/* Role distribution preview */}
        {count >= 2 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card>
              <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 }}>
                Role Distribution
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={{ padding: "4px 12px", borderRadius: 20, background: tokens.yellowBg, color: tokens.yellow, fontSize: 13, fontWeight: 600 }}>
                  ⚡ 1 God
                </span>
                <span style={{ padding: "4px 12px", borderRadius: 20, background: tokens.redBg, color: tokens.red, fontSize: 13, fontWeight: 600 }}>
                  🔪 {count >= 5 ? mafiaCount : `~${mafiaCount}`} Mafia
                </span>
                {config.doctorEnabled && (
                  <span style={{ padding: "4px 12px", borderRadius: 20, background: tokens.blueBg, color: tokens.blue, fontSize: 13, fontWeight: 600 }}>
                    💊 1 Doctor
                  </span>
                )}
                {config.policeEnabled && (
                  <span style={{ padding: "4px 12px", borderRadius: 20, background: tokens.purpleBg, color: tokens.purple, fontSize: 13, fontWeight: 600 }}>
                    🚔 1 Police
                  </span>
                )}
                <span style={{ padding: "4px 12px", borderRadius: 20, background: tokens.greenBg, color: tokens.green, fontSize: 13, fontWeight: 600 }}>
                  🏘️ {count >= 5 ? villagerCount : "?"} Villagers
                </span>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Special roles */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14 }}>
              Special Roles
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { key: "doctorEnabled", label: "Doctor 💊", desc: "Each night secretly protects one player" },
                { key: "policeEnabled", label: "Police 🚔", desc: "Each night secretly investigates one player" },
              ].map((opt) => (
                <div key={opt.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: tokens.black }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: tokens.grey3, marginTop: 2 }}>{opt.desc}</div>
                  </div>
                  <Toggle
                    value={config[opt.key as keyof GameConfig] as boolean}
                    onChange={(v) => setConfigState((c) => ({ ...c, [opt.key]: v }))}
                  />
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Discussion timer */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 12 }}>
              Discussion Timer
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[{ label: "3 min", value: 180 }, { label: "4 min", value: 240 }, { label: "5 min", value: 300 }].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setConfigState((c) => ({ ...c, discussionTimerSeconds: opt.value }))}
                  style={{
                    flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 14, fontWeight: 600,
                    border: `1.5px solid ${config.discussionTimerSeconds === opt.value ? tokens.red : tokens.border}`,
                    background: config.discussionTimerSeconds === opt.value ? tokens.redBg : "transparent",
                    color: config.discussionTimerSeconds === opt.value ? tokens.red : tokens.grey1,
                    cursor: "pointer",
                  }}
                >{opt.label}</button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Start */}
        <Btn
          fullWidth
          onClick={startGame}
          disabled={count < 5}
          style={{ padding: "16px", fontSize: 16 }}
        >
          {count < 5 ? `Need ${5 - count} more player${5 - count !== 1 ? "s" : ""}` : "Start Game →"}
        </Btn>

        <div style={{ textAlign: "center", fontSize: 12, color: tokens.grey4 }}>
          <a href="/" style={{ color: tokens.grey4, textDecoration: "none" }}>← PlayHub</a>
        </div>
      </div>

      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
}
