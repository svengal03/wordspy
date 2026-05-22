"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Btn, Card, NavBtn, Toggle, tokens, PlayHubLogo, OptionsMenu, PlayerNameInput, useGoHome } from "@playhub/ui";
import { useGame } from "./lib/store";
import { createPlayer, assignRoles, getMafiaCount } from "./lib/gameEngine";
import { DEFAULT_CONFIG, GameConfig } from "./lib/types";
import RoleReveal from "./components/RoleReveal";
import NightScreen from "./components/NightScreen";
import DayScreen from "./components/DayScreen";
import VoteScreen from "./components/VoteScreen";
import GameOverScreen from "./components/GameOverScreen";
import RulesModal from "./components/RulesModal";

export default function MafiaApp() {
  const { game, reset, restartGame } = useGame();

  // ─── Phase switcher ───────────────────────────────────────────────────────
  if (game.phase === "role-reveal") return <RoleReveal />;
  if (game.phase === "night") return <NightScreen />;
  if (game.phase === "day") return <DayScreen />;
  if (game.phase === "vote") return <VoteScreen />;
  if (game.phase === "game-over") return <GameOverScreen onPlayAgain={restartGame} />;

  // ─── Setup screen ─────────────────────────────────────────────────────────
  return <SetupScreen />;
}

// ─── Setup screen ─────────────────────────────────────────────────────────────
function SetupScreen() {
  const { game, set } = useGame();
  const goHome = useGoHome();

  // Pre-fill from a previous game — player[0] is always god/host
  const prevPlayers = game.players;
  const [hostName, setHostName] = useState(prevPlayers[0]?.name ?? "");
  const [hostConfirmed, setHostConfirmed] = useState(prevPlayers.length > 0);
  const [names, setNames] = useState<string[]>(prevPlayers.slice(1).map((p) => p.name));
  const [input, setInput] = useState("");
  const [config, setConfigState] = useState<GameConfig>(game.config ?? { ...DEFAULT_CONFIG });
  const [error, setError] = useState("");
  const [showRules, setShowRules] = useState(false);

  const allNames = hostConfirmed ? [hostName, ...names] : names;

  function confirmHost() {
    const name = hostName.trim();
    if (!name) return setError("Enter your name");
    setHostName(name);
    setHostConfirmed(true);
    setError("");
  }

  function addPlayer() {
    const name = input.trim();
    if (!name) return;
    if (allNames.length >= 15) return setError("Maximum 15 players");
    if (allNames.some((n) => n.toLowerCase() === name.toLowerCase())) return setError("Name already taken");
    setNames([...names, name]);
    setInput("");
    setError("");
  }

  function removePlayer(i: number) {
    setNames(names.filter((_, idx) => idx !== i));
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      if (!hostConfirmed) confirmHost();
      else addPlayer();
    }
  }

  function startGame() {
    if (allNames.length < 5) return setError("Need at least 5 players");
    const players = allNames.map((n) => createPlayer(n));
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

  function resetSetup() {
    setHostConfirmed(false);
    setHostName("");
    setNames([]);
    setConfigState({ ...DEFAULT_CONFIG });
    setError("");
  }

  const count = allNames.length;
  // 1 god always assigned; mafiaCount based on playing players (count - 1)
  const playingCount = Math.max(count - 1, 0);
  const mafiaCount = getMafiaCount(playingCount);
  const specialCount = (config.doctorEnabled ? 1 : 0) + (config.policeEnabled ? 1 : 0);
  const villagerCount = Math.max(0, playingCount - mafiaCount - specialCount);

  // ── Name entry step (like wordspy) ──────────────────────────────────────────
  if (!hostConfirmed) {
    return (
      <div style={{
        minHeight: "100dvh", background: tokens.bg,
        fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
        display: "flex", flexDirection: "column",
      }}>
        {/* Sticky Navbar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        padding: "14px 20px",
        background: "#FAFAF8",
        borderBottom: "0.5px solid rgba(0,0,0,0.08)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <PlayHubLogo appName="Mafia" />
        <div style={{ display: "flex", gap: 8 }}>
          <NavBtn onClick={() => setShowRules(true)}>Rules</NavBtn>
          <OptionsMenu onExit={goHome} />
        </div>
      </div>

      <div style={{ flex: 1, maxWidth: 480, margin: "0 auto", width: "100%", padding: "0 24px 40px", boxSizing: "border-box" }}>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ paddingTop: 32, marginBottom: 24 }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: tokens.black, letterSpacing: -1.2, lineHeight: 1.15, marginBottom: 10 }}>
              Lies, betrayal,<br />
              <span style={{ color: tokens.coral }}>mafia</span>.
            </div>
            <div style={{ fontSize: 15, color: tokens.grey2, lineHeight: 1.6, marginBottom: 32, maxWidth: 300 }}>
              Social deduction for 5–15 players. Vote out the Mafia before they take over.
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: tokens.grey3, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
                Your Name (Host)
              </div>
              <PlayerNameInput
                value={hostName}
                onChange={(val) => { setHostName(val); setError(""); }}
                onKeyDown={handleKey}
                placeholder="e.g. Rahul, Priya…"
                autoFocus
                style={{ fontSize: 15, padding: "12px 14px" }}
              />
            </Card>

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ background: tokens.redBg, border: `1.5px solid #FECACA`, borderRadius: 12, padding: "12px 16px", color: tokens.red, fontSize: 14, marginBottom: 14 }}>
                {error}
              </motion.div>
            )}

            <Btn fullWidth onClick={confirmHost} style={{ padding: "15px 24px", fontSize: 16 }}>
              Set Up Game →
            </Btn>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ marginTop: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14 }}>
              How it works
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { icon: "🎭", title: "Get your role", desc: "Mafia, Civilian, Doctor, or Detective. The God runs the game." },
                { icon: "🌙", title: "Night falls", desc: "Mafia strikes in secret. Doctor protects. Police investigates." },
                { icon: "☀️", title: "Day breaks", desc: "Discuss, accuse, and vote them out. Find the Mafia before it's too late." },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, background: "#F5F0ED",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0,
                  }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: tokens.black }}>{s.title}</div>
                    <div style={{ fontSize: 13, color: tokens.grey2, marginTop: 2, lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
        <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100dvh", background: tokens.bg,
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
      paddingBottom: 40,
    }}>
      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        padding: "14px 20px",
        background: "#FAFAF8",
        borderBottom: "0.5px solid rgba(0,0,0,0.08)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <PlayHubLogo appName="Mafia" />
        <div style={{ display: "flex", gap: 8 }}>
          <NavBtn onClick={() => setShowRules(true)}>Rules</NavBtn>
          <OptionsMenu onNewGame={resetSetup} onExit={goHome} />
        </div>
      </div>

      <div style={{ padding: "20px", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Player entry */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 12 }}>
              Players ({count}/15)
            </div>

            {/* Host row (irremovable) */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid ${tokens.border}` }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8, background: tokens.redBg,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700, color: tokens.red, flexShrink: 0,
              }}>{hostName.slice(0, 2).toUpperCase()}</div>
              <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: tokens.black }}>{hostName}</div>
              <span style={{ fontSize: 11, color: tokens.red, fontWeight: 700 }}>HOST</span>
            </div>

            {/* Other players */}
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
                        fontSize: 11, fontWeight: 700, color: tokens.grey2, flexShrink: 0,
                      }}>{name.slice(0, 2).toUpperCase()}</div>
                      <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: tokens.black }}>{name}</div>
                      <button
                        onClick={() => removePlayer(i)}
                        style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${tokens.border}`, background: "transparent", cursor: "pointer", fontSize: 14, color: tokens.grey3, display: "flex", alignItems: "center", justifyContent: "center" }}
                      >×</button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Add player input */}
            {count < 15 && (
              <div style={{ display: "flex", gap: 8 }}>
                <PlayerNameInput
                  value={input}
                  onChange={(val) => { setInput(val); setError(""); }}
                  onKeyDown={handleKey}
                  placeholder="Add player…"
                  autoFocus
                  style={{ flex: 1 }}
                />
                <Btn onClick={addPlayer} style={{ padding: "10px 16px", fontSize: 14 }}>Add</Btn>
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

        {/* House Rules */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <Card>
            <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14 }}>
              House Rules
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {config.doctorEnabled && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: tokens.black }}>Doctor Self-Save 💊</div>
                    <div style={{ fontSize: 12, color: tokens.grey3, marginTop: 2 }}>Allow doctor to protect themselves each night</div>
                  </div>
                  <Toggle
                    value={config.doctorCanSelfSave}
                    onChange={(v) => setConfigState((c) => ({ ...c, doctorCanSelfSave: v }))}
                  />
                </div>
              )}
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
                    border: `1.5px solid ${config.discussionTimerSeconds === opt.value ? tokens.coral : tokens.border}`,
                    background: config.discussionTimerSeconds === opt.value ? "#FAECE7" : "transparent",
                    color: config.discussionTimerSeconds === opt.value ? "#993C1D" : tokens.grey1,
                    cursor: "pointer",
                  }}
                >{opt.label}</button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Voting timer */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <Card>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: config.votingTimerEnabled ? 14 : 0 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: tokens.black }}>Voting Timer</div>
                <div style={{ fontSize: 12, color: tokens.grey3, marginTop: 2 }}>Countdown during vote — default off</div>
              </div>
              <Toggle
                value={config.votingTimerEnabled}
                onChange={(v) => setConfigState((c) => ({ ...c, votingTimerEnabled: v }))}
              />
            </div>
            {config.votingTimerEnabled && (
              <div style={{ display: "flex", gap: 8 }}>
                {[{ label: "30s", value: 30 }, { label: "60s", value: 60 }, { label: "90s", value: 90 }].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setConfigState((c) => ({ ...c, votingTimerSeconds: opt.value }))}
                    style={{
                      flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 14, fontWeight: 600,
                      border: `1.5px solid ${config.votingTimerSeconds === opt.value ? tokens.coral : tokens.border}`,
                      background: config.votingTimerSeconds === opt.value ? "#FAECE7" : "transparent",
                      color: config.votingTimerSeconds === opt.value ? "#993C1D" : tokens.grey1,
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >{opt.label}</button>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Start */}
        <Btn
          fullWidth
          onClick={startGame}
          disabled={!hostConfirmed || count < 5}
          style={{ padding: "16px", fontSize: 16 }}
        >
          {!hostConfirmed ? "Set your name first"
            : count < 5 ? `Need ${5 - count} more player${5 - count !== 1 ? "s" : ""}`
            : "Start Game →"}
        </Btn>

      </div>

      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
}
