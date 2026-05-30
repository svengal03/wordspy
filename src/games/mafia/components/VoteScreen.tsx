"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, Btn, tokens, Avatar, Screen, TopBar, NavBtn, OptionsMenu, PhaseTrail, useGoHome } from "@playhub/ui";
import { useGame } from "../store";
import { getLiving, eliminatePlayer, checkWin, MAFIA_PHASES } from "../engine";
import RulesModal from "./RulesModal";
import GameLogModal from "./GameLogModal";

export default function VoteScreen() {
  const { game, set, restartGame } = useGame();
  const goHome = useGoHome();
  const { players, round, config } = game;
  const living = getLiving(players).filter((p) => p.role !== "god");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const { roundHistory } = game;
  const [timeLeft, setTimeLeft] = useState(config.votingTimerSeconds);

  useEffect(() => {
    if (!config.votingTimerEnabled) return;
    setTimeLeft(config.votingTimerSeconds);
    const tick = setInterval(() => {
      setTimeLeft((t) => (t <= 1 ? (clearInterval(tick), 0) : t - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, [config.votingTimerEnabled, config.votingTimerSeconds]);

  function confirm() {
    if (!selectedId) return;
    const nominated = players.find((p) => p.id === selectedId);
    if (!nominated) return;
    const updatedPlayers = eliminatePlayer(players, selectedId);
    const history = [...game.eliminationHistory, { round, phase: "day" as const, playerName: nominated.name, role: nominated.role! }];
    const roundHistory = game.roundHistory.map((e) =>
      e.round === round ? { ...e, dayVotedOut: nominated.name, dayVotedOutRole: nominated.role } : e
    );
    const winner = checkWin(updatedPlayers);
    set({ players: updatedPlayers, eliminationHistory: history, roundHistory, winner, phase: winner ? "game-over" : "day", nominatedPlayerId: null, voteYes: 0, voteNo: 0, lastNightResult: null });
  }

  function cancel() {
    set({ phase: "day", nominatedPlayerId: null, voteYes: 0, voteNo: 0 });
  }

  return (
    <Screen>
      <TopBar
        appName="Mafia"
        title={`Day ${round} · Vote`}
        right={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {config.votingTimerEnabled && (
              <div style={{
                fontSize: 18, fontWeight: 800,
                color: timeLeft <= 10 ? tokens.red : tokens.grey1,
                background: timeLeft <= 10 ? tokens.redBg : tokens.bg,
                padding: "4px 10px", borderRadius: 8, fontVariantNumeric: "tabular-nums",
                transition: "all 0.3s",
              }}>{timeLeft}s</div>
            )}
            {roundHistory.length > 0 && <NavBtn onClick={() => setShowLog(true)}>Recap</NavBtn>}
            <NavBtn onClick={() => setShowRules(true)}>Rules</NavBtn>
            <OptionsMenu onNewGame={restartGame} onExit={goHome} />
          </div>
        }
      />

      <PhaseTrail phases={MAFIA_PHASES} current="Vote" accentColor={tokens.coral} />

      <div style={{ padding: "20px", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Header */}
        <div style={{ paddingTop: 8 }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: tokens.black, letterSpacing: -0.5, marginBottom: 4 }}>
            Eliminate one
          </div>
          <div style={{ fontSize: 14, color: tokens.grey2 }}>Day {round}</div>
        </div>

        {/* Warnings */}
        <div style={{
          background: tokens.yellowBg, border: `1.5px solid #FDE047`,
          borderRadius: 14, padding: "12px 16px",
          display: "flex", flexDirection: "column", gap: 6,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: tokens.yellow }}>Village votes to eliminate — or skip if no consensus</div>
          <div style={{ fontSize: 12, color: tokens.grey1, lineHeight: 1.5 }}>
            Vote verbally. Once decided, God taps the eliminated player below. Do not reveal their role.
          </div>
        </div>

        {/* Player cards */}
        <Card>
          <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 12 }}>
            Select who was eliminated
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {living.map((p) => (
              <motion.button
                key={p.id}
                onClick={() => setSelectedId(selectedId === p.id ? null : p.id)}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 14px", borderRadius: 14, width: "100%",
                  border: `1.5px solid ${selectedId === p.id ? tokens.red : tokens.border}`,
                  background: selectedId === p.id ? tokens.redBg : tokens.white,
                  cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                  transition: "all .15s",
                }}
              >
                <Avatar name={p.name} size={40} active={selectedId === p.id} />
                <div style={{ flex: 1, fontSize: 15, fontWeight: 600, color: tokens.black }}>{p.name}</div>
                {selectedId === p.id && (
                  <span style={{ fontSize: 18, color: tokens.red }}>✓</span>
                )}
              </motion.button>
            ))}
          </div>
        </Card>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="ghost" fullWidth onClick={cancel} style={{ padding: "16px", fontSize: 16 }}>
            Skip Round
          </Btn>
          <Btn variant="danger" fullWidth onClick={confirm} disabled={!selectedId} style={{ padding: "16px", fontSize: 16 }}>
            Eliminate →
          </Btn>
        </div>
      </div>

      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
      <GameLogModal isOpen={showLog} onClose={() => setShowLog(false)} roundHistory={roundHistory} />
    </Screen>
  );
}
