"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, Btn, tokens, Avatar, RoleBadge } from "@/components/ui";
import { useGame } from "@/lib/store";
import { getLiving } from "@/lib/gameEngine";
import RulesModal from "@/components/game/RulesModal";

export default function DayScreen() {
  const { game, set, reset } = useGame();
  const { players, lastNightResult, round, config } = game;
  const living = getLiving(players);
  const dead = players.filter((p) => p.isEliminated);
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(config.discussionTimerSeconds);
  const [showRules, setShowRules] = useState(false);

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
    <div style={{
      minHeight: "100dvh", background: tokens.bg,
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Top bar */}
      <div style={{
        padding: "14px 20px", borderBottom: `1px solid ${tokens.border}`,
        background: tokens.white, display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: tokens.black }}>
            Mafia<span style={{ color: tokens.red }}>.</span>
          </div>
          <div style={{ fontSize: 12, color: tokens.grey3 }}>Day {round} · Discussion</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {timerActive ? (
            <div style={{
              fontSize: 18, fontWeight: 800, color: timerColor,
              fontVariantNumeric: "tabular-nums",
              background: timerColor + "15", padding: "6px 14px", borderRadius: 10,
            }}>
              {fmt(timeLeft)}
            </div>
          ) : (
            <Btn variant="secondary" onClick={() => setTimerActive(true)} style={{ padding: "7px 14px", fontSize: 13 }}>
              Start timer
            </Btn>
          )}
          <button
            onClick={() => setShowRules(true)}
            style={{
              padding: "7px 12px", borderRadius: 10,
              border: `1.5px solid ${tokens.border}`,
              background: tokens.white, cursor: "pointer",
              fontSize: 13, fontWeight: 600, color: tokens.grey1,
              fontFamily: "inherit",
            }}
          >?</button>
          <button
            onClick={reset}
            style={{
              padding: "7px 12px", borderRadius: 10,
              border: `1.5px solid ${tokens.border}`,
              background: tokens.white, cursor: "pointer",
              fontSize: 13, fontWeight: 600, color: tokens.red,
              fontFamily: "inherit",
            }}
          >✕</button>
        </div>
      </div>

      <div style={{ padding: "16px 20px", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Night result */}
        {lastNightResult && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{
              borderRadius: 14, padding: "14px 18px",
              background: lastNightResult.killedId ? tokens.redBg : tokens.greenBg,
              border: `1.5px solid ${lastNightResult.killedId ? "#FECACA" : "#BBF7D0"}`,
            }}>
              {lastNightResult.killedId ? (
                <>
                  <div style={{ fontSize: 14, fontWeight: 700, color: tokens.red, marginBottom: 2 }}>
                    {lastNightResult.killedName} was eliminated during the night
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
                  <span style={{ fontSize: 11, fontWeight: 700, color: tokens.yellow }}>⚡ GOD</span>
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

        <Btn fullWidth variant="danger" onClick={goToVote} style={{ padding: "14px", fontSize: 15 }}>
          Eliminate a Player →
        </Btn>

        <Btn fullWidth variant="secondary" onClick={startNight} style={{ padding: "14px", fontSize: 15 }}>
          Start Night
        </Btn>
      </div>

      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
}
