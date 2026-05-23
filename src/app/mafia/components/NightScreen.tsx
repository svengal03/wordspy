"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Btn, Card, tokens, Screen, TopBar, NavBtn, OptionsMenu, PhaseTrail, useGoHome } from "@playhub/ui";
import { useGame } from "../lib/store";
import { Player, NightSubPhase } from "../lib/types";
import { getLiving, resolveNight, eliminatePlayer, checkWin } from "../lib/gameEngine";
import RulesModal from "./RulesModal";

const MAFIA_PHASES = ["Role Reveal", "Night", "Day", "Vote", "Results"];

export default function NightScreen() {
  const { game, set, reset, restartGame } = useGame();
  const goHome = useGoHome();
  const { players, nightSubPhase, nightActions, config, round } = game;
  const living = getLiving(players);
  const playingLiving = living.filter((p) => p.role !== "god");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [policeResult, setPoliceResult] = useState<{ name: string; isMafia: boolean } | null>(null);
  const [showRules, setShowRules] = useState(false);

  function goToSubPhase(sub: NightSubPhase) {
    setSelectedId(null);
    setPoliceResult(null);
    set({ nightSubPhase: sub });
  }

  function confirmSelection() {
    if (!selectedId) return;
    const sub = nightSubPhase;

    if (sub === "police-wake") {
      const t = players.find((p) => p.id === selectedId);
      if (t) setPoliceResult({ name: t.name, isMafia: t.role === "mafia" });
      set({ nightActions: { ...nightActions, policeTarget: selectedId } } as any);
      return; // show result, wait for continue
    }

    set({
      nightActions: {
        ...nightActions,
        ...(sub === "mafia-wake" ? { mafiaTarget: selectedId } : {}),
        ...(sub === "doctor-wake" ? { doctorTarget: selectedId } : {}),
      },
    } as any);

    advanceAfterRole(sub);
    setSelectedId(null);
  }

  function getDoctorTargets(): Player[] {
    const doctor = players.find((p) => p.role === "doctor");
    return playingLiving.filter((p) => {
      if (p.id === nightActions.doctorLastTarget) return false;
      if (!config.doctorCanSelfSave && doctor && p.id === doctor.id) return false;
      return true;
    });
  }

  function advanceAfterRole(sub: NightSubPhase) {
    if (sub === "mafia-wake") {
      const doctorAlive = players.some(p => p.role === "doctor" && !p.isEliminated);
      if (config.doctorEnabled && doctorAlive && getDoctorTargets().length > 0) {
        goToSubPhase("doctor-wake");
      } else {
        const policeAlive = players.some(p => p.role === "police" && !p.isEliminated);
        if (config.policeEnabled && policeAlive) goToSubPhase("police-wake");
        else endNight();
      }
    } else if (sub === "doctor-wake") {
      const policeAlive = players.some(p => p.role === "police" && !p.isEliminated);
      if (config.policeEnabled && policeAlive) goToSubPhase("police-wake");
      else endNight();
    } else if (sub === "police-wake") {
      endNight();
    }
  }

  function continueAfterPolice() {
    setPoliceResult(null);
    advanceAfterRole("police-wake");
  }

  function endNight() {
    const result = resolveNight(game);
    let updatedPlayers = players;
    const history = [...game.eliminationHistory];
    if (result.killedId) {
      updatedPlayers = eliminatePlayer(players, result.killedId);
      history.push({ round, phase: "night" as const, playerName: result.killedName!, role: result.killedRole! });
    }
    const winner = checkWin(updatedPlayers);
    set({
      nightSubPhase: "resolving",
      players: updatedPlayers,
      lastNightResult: result,
      eliminationHistory: history,
      nightActions: { ...nightActions, doctorLastTarget: nightActions.doctorTarget },
      winner,
      phase: winner ? "game-over" : "day",
    });
  }

  const phaseInfo: Record<NightSubPhase, { label: string; color: string; instruction: string }> = {
    "sleeping":    { label: "Night has fallen",  color: tokens.grey2,   instruction: "" },
    "mafia-wake":  { label: "Mafia awake",       color: tokens.red,     instruction: "Pick your target" },
    "doctor-wake": { label: "Doctor awake",      color: tokens.blue,    instruction: "Protect a player" },
    "police-wake": { label: "Police awake",      color: tokens.purple,  instruction: "Investigate a player" },
    "resolving":   { label: "Resolving…",        color: tokens.grey3,   instruction: "" },
  };

  const info = phaseInfo[nightSubPhase];

  const doctor = players.find((p) => p.role === "doctor");
  const targets: Player[] = (() => {
    if (nightSubPhase === "mafia-wake") return playingLiving.filter((p) => p.role !== "mafia");
    if (nightSubPhase === "doctor-wake") return getDoctorTargets();
    if (nightSubPhase === "police-wake") return playingLiving;
    return [];
  })();

  return (
    <Screen style={{ display: "flex", flexDirection: "column" }}>
      <TopBar
        appName="Mafia"
        right={
          <div style={{ display: "flex", gap: 8 }}>
            <NavBtn onClick={() => setShowRules(true)}>Rules</NavBtn>
            <OptionsMenu onNewGame={restartGame} onExit={goHome} />
          </div>
        }
      />
      <PhaseTrail phases={MAFIA_PHASES} current="Night" accentColor={tokens.coral} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "24px 20px", boxSizing: "border-box" }}>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 28, paddingTop: 8 }}>
        <motion.div key={nightSubPhase} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: tokens.black, letterSpacing: -0.5 }}>
            {info.label}
          </div>
          <div style={{ fontSize: 13, color: tokens.grey3, marginTop: 4 }}>Round {round}</div>
        </motion.div>
      </div>

      <div style={{ flex: 1, maxWidth: 400, margin: "0 auto", width: "100%" }}>
        <AnimatePresence mode="wait">

          {/* Sleeping */}
          {nightSubPhase === "sleeping" && (
            <motion.div key="sleeping" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card style={{ textAlign: "center", padding: "28px 24px", marginBottom: 16 }}>
                <div style={{ fontSize: 14, color: tokens.grey2, lineHeight: 1.6, marginBottom: 20 }}>
                  Everyone closes their eyes.
                </div>
                <Btn fullWidth onClick={() => goToSubPhase("mafia-wake")} style={{ padding: "14px" }}>
                  Wake the Mafia
                </Btn>
              </Card>
              <div style={{ fontSize: 12, color: tokens.grey3, textAlign: "center" }}>
                Living: {playingLiving.length}
              </div>
            </motion.div>
          )}

          {/* Role selection */}
          {(nightSubPhase === "mafia-wake" || nightSubPhase === "doctor-wake" || nightSubPhase === "police-wake") && !policeResult && (
            <motion.div key={nightSubPhase} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card>
                <div style={{ fontSize: 12, fontWeight: 700, color: info.color, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>
                  {info.instruction}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  {targets.length === 0 ? (
                    <div style={{ fontSize: 14, color: tokens.grey2, textAlign: "center", padding: 16 }}>
                      No valid targets available.
                    </div>
                  ) : targets.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedId(p.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "12px 14px", borderRadius: 12,
                        border: `1.5px solid ${selectedId === p.id ? info.color : tokens.border}`,
                        background: selectedId === p.id ? info.color + "12" : tokens.bg,
                        cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "all .15s",
                      }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: 10, background: "#F0EDE9",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: 700, color: tokens.grey2,
                      }}>{p.name.slice(0, 2).toUpperCase()}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: tokens.black, flex: 1 }}>{p.name}</div>
                      {selectedId === p.id && <span style={{ fontSize: 16, color: info.color }}>✓</span>}
                    </button>
                  ))}
                </div>
                <Btn fullWidth onClick={confirmSelection} disabled={!selectedId} style={{ padding: "14px" }}>
                  Confirm →
                </Btn>
              </Card>
            </motion.div>
          )}

          {/* Police result */}
          {policeResult && (
            <motion.div key="police-result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card>
                <div style={{ fontSize: 12, fontWeight: 700, color: tokens.purple, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>
                  Investigation result
                </div>
                <div style={{
                  background: policeResult.isMafia ? tokens.redBg : tokens.greenBg,
                  border: `1px solid ${policeResult.isMafia ? "#FECACA" : "#BBF7D0"}`,
                  borderRadius: 14, padding: "16px", marginBottom: 16,
                }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: policeResult.isMafia ? tokens.red : tokens.green }}>
                    {policeResult.name} is {policeResult.isMafia ? "MAFIA" : "NOT Mafia"}
                  </div>
                  <div style={{ fontSize: 12, color: tokens.grey2, marginTop: 4 }}>
                    Remember this. Don't tell anyone.
                  </div>
                </div>
                <Btn fullWidth onClick={continueAfterPolice} style={{ padding: "14px" }}>
                  Continue →
                </Btn>
              </Card>
            </motion.div>
          )}

          {/* Resolving */}
          {nightSubPhase === "resolving" && (
            <motion.div key="resolving" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card style={{ textAlign: "center", padding: "32px 24px" }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: tokens.grey2 }}>Resolving…</div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      </div>
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </Screen>
  );
}
