"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, Btn, tokens, Avatar, Screen, TopBar, NavBtn, OptionsMenu, PhaseTrail, useGoHome } from "@playhub/ui";
import { useGame } from "../store";
import { getLiving, MAFIA_PHASES } from "../engine";
import { RoleBadge } from "./ui";
import RulesModal from "./RulesModal";
import GameLogModal from "./GameLogModal";

export default function DayScreen() {
  const { game, set, restartGame } = useGame();
  const goHome = useGoHome();
  const { players, lastNightResult, round, config, roundHistory, eliminationHistory } = game;
  const living = getLiving(players);
  const votedThisRound = eliminationHistory.some((e) => e.round === round && e.phase === "day");
  const dead = players.filter((p) => p.isEliminated);
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(config.discussionTimerSeconds);
  const [showRules, setShowRules] = useState(false);
  const [showLog, setShowLog] = useState(false);

  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timerActive, timeLeft]);

  function fmt(s: number) {
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  }

  const timerColor = timeLeft < 30 ? tokens.red : timeLeft < 60 ? tokens.yellow : tokens.green;

  function goToVote() {
    set({ phase: "vote", nominatedPlayerId: null, voteYes: 0, voteNo: 0 });
  }

  function startNight() {
    set({
      phase: "night",
      nightSubPhase: "sleeping",
      round: round + 1,
      nightActions: { mafiaTarget: null, doctorTarget: null, policeTarget: null, doctorLastTarget: game.nightActions.doctorLastTarget },
      nominatedPlayerId: null,
      lastNightResult: null,
    });
  }


  const roleLabel = (role: string | null) => {
    if (role === "villager") return "Villager";
    if (role === "police") return "Police";
    if (role === "doctor") return "Doctor";
    if (role === "mafia") return "Mafia";
    return role ?? "";
  };

  return (
    <Screen>
      <TopBar
        appName="Mafia"
        title={`Day ${round} · Discussion`}
        right={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {roundHistory.length > 0 && <NavBtn onClick={() => setShowLog(true)}>Recap</NavBtn>}
            <NavBtn onClick={() => setShowRules(true)}>Rules</NavBtn>
            <OptionsMenu onNewGame={restartGame} onExit={goHome} />
          </div>
        }
      />

      <PhaseTrail phases={MAFIA_PHASES} current="Day" accentColor={tokens.coral} />

      <div style={{ padding: "16px 20px", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Night result */}
        {lastNightResult && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{
              borderRadius: 14, padding: "14px 18px",
              background: lastNightResult.killedId ? tokens.redBg : tokens.greenBg,
              border: `1.5px solid ${lastNightResult.killedId ? `${tokens.red}40` : `${tokens.green}40`}`,
            }}>
              {lastNightResult.killedId ? (
                <>
                  <div style={{ fontSize: 14, fontWeight: 700, color: tokens.red, marginBottom: 2 }}>
                    {lastNightResult.killedName} was killed by Mafia
                  </div>
                  <div style={{ fontSize: 13, color: tokens.grey2 }}>
                    They were a <strong>{roleLabel(lastNightResult.killedRole)}</strong>
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 14, fontWeight: 700, color: tokens.green }}>
                  {lastNightResult.savedByDoctor
                    ? "Doctor saved someone — nobody was killed last night"
                    : "Nobody was eliminated last night"}
                </div>
              )}

              {/* Round log — no emojis */}
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4, borderTop: `1px solid ${lastNightResult.killedId ? `${tokens.red}40` : `${tokens.green}40`}`, paddingTop: 10 }}>
                {lastNightResult.mafiaTargetName && (
                  <div style={{ fontSize: 12, color: tokens.grey1 }}>
                    Mafia targeted <strong>{lastNightResult.mafiaTargetName}</strong>
                    {lastNightResult.savedByDoctor ? " — saved by Doctor" : lastNightResult.killedId ? " — killed" : ""}
                  </div>
                )}
                {lastNightResult.doctorTargetName && (
                  <div style={{ fontSize: 12, color: tokens.grey1 }}>
                    Doctor protected <strong>{lastNightResult.doctorTargetName}</strong>
                    {lastNightResult.savedByDoctor ? " — save successful" : ""}
                  </div>
                )}
                {lastNightResult.policeResult && (
                  <div style={{ fontSize: 12, color: tokens.grey1 }}>
                    Police investigated <strong>{lastNightResult.policeResult.targetName}</strong> —{" "}
                    <span style={{ fontWeight: 700, color: lastNightResult.policeResult.isMafia ? tokens.red : tokens.green }}>
                      {lastNightResult.policeResult.isMafia ? "Mafia" : "Not Mafia"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Living players */}
        <Card>
          <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 12 }}>
            Living Players ({living.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {living.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
                <Avatar name={p.name} size={38} />
                <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: tokens.black }}>{p.name}</div>
                {p.role === "god" && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: tokens.yellow }}>GOD</span>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Eliminated */}
        {dead.length > 0 && (
          <Card>
            <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 12 }}>
              Eliminated ({dead.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {dead.map((p) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, opacity: 0.55 }}>
                  <Avatar name={p.name} size={38} eliminated />
                  <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: tokens.grey2 }}>{p.name}</div>
                  {p.role && p.role !== "god" && <RoleBadge role={p.role} />}
                </div>
              ))}
            </div>
          </Card>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderRadius: 14, background: timerActive ? timerColor + "12" : tokens.bg, border: `1.5px solid ${timerActive ? timerColor + "40" : tokens.border}`, transition: "all 0.3s" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: tokens.grey2 }}>Discussion timer</div>
          {timerActive ? (
            <div style={{ fontSize: 22, fontWeight: 800, color: timerColor, fontVariantNumeric: "tabular-nums" }}>
              {fmt(timeLeft)}
            </div>
          ) : (
            <Btn variant="secondary" onClick={() => setTimerActive(true)} style={{ padding: "7px 16px", fontSize: 13 }}>
              Start timer
            </Btn>
          )}
        </div>

        {!votedThisRound && (
          <Btn fullWidth variant="danger" onClick={goToVote} style={{ padding: "16px", fontSize: 16 }}>
            Eliminate a Player →
          </Btn>
        )}

        <Btn fullWidth variant="secondary" onClick={startNight} style={{ padding: "16px", fontSize: 16 }}>
          Start Night
        </Btn>
      </div>

      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
      <GameLogModal isOpen={showLog} onClose={() => setShowLog(false)} roundHistory={roundHistory} />
    </Screen>
  );
}
