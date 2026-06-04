"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Btn, Card, NavBtn, Toggle, tokens, TopBar, Screen, Avatar, ErrorBox, OptionsMenu, PlayerNameInput, useGoHome } from "@playhub/ui";
import { GetReadyScreen } from "@/games/shared";
import { useGame } from "@/games/mafia/store";
import { createPlayer, assignRoles } from "@/games/mafia/engine";
import { DEFAULT_CONFIG, GameConfig } from "@/games/mafia/types";
import RoleReveal from "@/games/mafia/components/RoleReveal";
import NightScreen from "@/games/mafia/components/NightScreen";
import DayScreen from "@/games/mafia/components/DayScreen";
import VoteScreen from "@/games/mafia/components/VoteScreen";
import GameOverScreen from "@/games/mafia/components/GameOverScreen";
import RulesModal from "@/games/mafia/components/RulesModal";

export function MafiaGame() {
  const { game, restartGame, set } = useGame();

  // ─── Phase switcher ───────────────────────────────────────────────────────
  if (game.phase === "get-ready") {
    const host = game.players[0];
    const playerCount = game.players.length;
    return (
      <GetReadyScreen
        appName="Mafia"
        accentColor={tokens.coral}
        title="The town awakens"
        subtitle={
          <>
            {host && <><strong style={{ color: tokens.coral }}>{host.name}</strong> is hosting · </>}
            {playerCount} player{playerCount !== 1 ? "s" : ""}
          </>
        }
        hints={[
          { icon: "🤫", text: "Each player will privately see their secret role." },
          { icon: "📱", text: "Pass the phone around — don't peek at others' screens." },
        ]}
        buttonLabel="Reveal Roles →"
        onStart={() => set({ phase: "role-reveal" })}
        onNewGame={restartGame}
      />
    );
  }
  if (game.phase === "role-reveal") return <RoleReveal />;
  if (game.phase === "night") return <NightScreen />;
  if (game.phase === "day") return <DayScreen />;
  if (game.phase === "vote") return <VoteScreen />;
  if (game.phase === "game-over") return <GameOverScreen onPlayAgain={restartGame} />;

  // ─── Setup screen ─────────────────────────────────────────────────────────
  return <SetupScreen />;
}

// ─── Role stepper ─────────────────────────────────────────────────────────────
function RoleStepper({ label, value, onSet, min = 0, max }: {
  label: string; value: number; onSet: (v: number) => void; min?: number; max: number;
}) {
  const btnStyle = (disabled: boolean): React.CSSProperties => ({
    width: 40, height: 40, borderRadius: 10, border: `1.5px solid ${tokens.border}`,
    background: "transparent", fontSize: 18, lineHeight: 1, flexShrink: 0,
    color: disabled ? tokens.grey4 : tokens.grey1,
    cursor: disabled ? "default" : "pointer", fontFamily: "inherit",
    display: "flex", alignItems: "center", justifyContent: "center",
  });
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: tokens.black }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => onSet(value - 1)} disabled={value <= min} style={btnStyle(value <= min)}>−</button>
        <div style={{ minWidth: 28, textAlign: "center", fontSize: 16, fontWeight: 700, color: tokens.black }}>{value}</div>
        <button onClick={() => onSet(value + 1)} disabled={value >= max} style={btnStyle(value >= max)}>+</button>
      </div>
    </div>
  );
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
    const vc = playingCount - config.mafiaCount - config.doctorCount - config.policeCount;
    if (vc < 1) return setError("Need at least 1 villager — reduce special roles or add more players");
    if (config.mafiaCount >= playingCount - config.mafiaCount) return setError("Mafia outnumbers the town — reduce mafia count");
    const players = allNames.map((n) => createPlayer(n));
    const withRoles = assignRoles(players, config);
    set({
      phase: "get-ready",
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
      roundHistory: [],
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
  const specialCount = config.doctorCount + config.policeCount;
  const villagerCount = playingCount - config.mafiaCount - specialCount;
  const maxMafia = Math.max(1, playingCount - specialCount - 1);
  const maxDoctor = Math.max(0, playingCount - config.mafiaCount - config.policeCount - 1);
  const maxPolice = Math.max(0, playingCount - config.mafiaCount - config.doctorCount - 1);

  const howItWorks = (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
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
              width: 40, height: 40, borderRadius: 12, background: tokens.iconBg,
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
  );

  // ── Name entry step (like wordspy) ──────────────────────────────────────────
  if (!hostConfirmed) {
    return (
      <Screen style={{ display: "flex", flexDirection: "column" }}>
        <TopBar
          appName="Mafia"
          right={
            <div style={{ display: "flex", gap: 8 }}>
              <NavBtn onClick={() => setShowRules(true)}>Rules</NavBtn>
              <NavBtn onClick={goHome}>Exit</NavBtn>
            </div>
          }
        />

        <div className="ph-lobby-body" style={{ flex: 1 }}>
          <div className="ph-lobby-primary">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ paddingTop: 32, marginBottom: 24 }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: tokens.black, letterSpacing: -1.2, lineHeight: 1.15, marginBottom: 10 }}>
                Lies, betrayal,<br />
                <span style={{ color: tokens.coral }}>mafia</span>.
              </div>
              <div style={{ fontSize: 15, color: tokens.grey2, lineHeight: 1.6, marginBottom: 32, maxWidth: 320 }}>
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

              {error && <ErrorBox>{error}</ErrorBox>}

              <Btn fullWidth onClick={confirmHost} style={{ padding: "15px 24px", fontSize: 16, marginTop: error ? 12 : 0 }}>
                Set Up Game →
              </Btn>
            </motion.div>

            <div className="ph-hiw-inline" style={{ marginTop: 32 }}>{howItWorks}</div>
          </div>

          <div className="ph-lobby-secondary ph-hiw-sidebar">{howItWorks}</div>
        </div>
        <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
      </Screen>
    );
  }

  return (
    <Screen style={{ paddingBottom: 40 }}>
      <TopBar
        appName="Mafia"
        right={
          <div style={{ display: "flex", gap: 8 }}>
            <NavBtn onClick={() => setShowRules(true)}>Rules</NavBtn>
            <OptionsMenu onNewGame={resetSetup} onExit={goHome} />
          </div>
        }
      />

      <div className="ph-content" style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 20 }}>

        {/* Player entry */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 12 }}>
              Players ({count}/15)
            </div>

            {/* Host row (irremovable) */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid ${tokens.border}` }}>
              <Avatar name={hostName} size={30} color={tokens.red} />
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
                      <Avatar name={name} size={30} />
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

        {/* Role Config */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 16 }}>
              Role Config
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <RoleStepper label="Mafia" value={config.mafiaCount} onSet={(v) => setConfigState((c) => ({ ...c, mafiaCount: v }))} min={1} max={maxMafia} />
              <RoleStepper label="Doctor" value={config.doctorCount} onSet={(v) => setConfigState((c) => ({ ...c, doctorCount: v }))} min={0} max={maxDoctor} />
              <RoleStepper label="Police" value={config.policeCount} onSet={(v) => setConfigState((c) => ({ ...c, policeCount: v }))} min={0} max={maxPolice} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: `1px solid ${tokens.border}` }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: tokens.grey2 }}>Villagers</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: villagerCount < 1 ? tokens.red : tokens.grey2 }}>
                  {playingCount > 0 ? Math.max(0, villagerCount) : "—"}
                </div>
              </div>
              {config.doctorCount > 0 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, paddingTop: 4, borderTop: `1px solid ${tokens.border}` }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: tokens.black }}>Doctor Self-Save</div>
                    <div style={{ fontSize: 12, color: tokens.grey3, marginTop: 2 }}>Allow doctor to protect themselves each night</div>
                  </div>
                  <Toggle value={config.doctorCanSelfSave} onChange={(v) => setConfigState((c) => ({ ...c, doctorCanSelfSave: v }))} />
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Role distribution */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { bg: tokens.yellowBg, color: tokens.yellow, label: "1 God" },
              { bg: tokens.redBg, color: tokens.red, label: `${config.mafiaCount} Mafia` },
              ...(config.doctorCount > 0 ? [{ bg: tokens.blueBg, color: tokens.blue, label: `${config.doctorCount} Doctor` }] : []),
              ...(config.policeCount > 0 ? [{ bg: tokens.purpleBg, color: tokens.purple, label: `${config.policeCount} Police` }] : []),
              { bg: tokens.greenBg, color: tokens.green, label: `${playingCount > 0 ? Math.max(0, villagerCount) : "?"} Villagers` },
            ].map((chip) => (
              <span key={chip.label} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 12px", borderRadius: 20, background: chip.bg, color: chip.color, fontSize: 13, fontWeight: 600 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: chip.color, flexShrink: 0, display: "inline-block" }} />
                {chip.label}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Discussion timer */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
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
                    background: config.discussionTimerSeconds === opt.value ? tokens.accentBg : "transparent",
                    color: config.discussionTimerSeconds === opt.value ? tokens.coralDark : tokens.grey1,
                    cursor: "pointer",
                  }}
                >{opt.label}</button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Voting timer */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
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
                      background: config.votingTimerSeconds === opt.value ? tokens.accentBg : "transparent",
                      color: config.votingTimerSeconds === opt.value ? tokens.coralDark : tokens.grey1,
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
    </Screen>
  );
}
