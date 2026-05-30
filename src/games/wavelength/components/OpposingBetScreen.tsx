"use client";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Screen, TopBar, Card, Btn, NavBtn, tokens, OptionsMenu, useGoHome } from "@playhub/ui";
import { WAVELENGTH_TEAM_META } from "@playhub/core";
import { useGame } from "../store";
import { submitOpposingBet } from "../engine";
import { OpposingBet, TeamId } from "../types";
import { RoundBar, SectionLabel } from "./ui";
import RulesModal from "./RulesModal";
import RecapModal from "./RecapModal";
import SpectrumDial from "./SpectrumDial";

export default function OpposingBetScreen() {
  const { game, set, restartGame } = useGame();
  const goHome = useGoHome();
  const [bet, setBet] = useState<OpposingBet | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
  const betRef = useRef<OpposingBet | null>(null);
  const gameRef = useRef(game);
  gameRef.current = game;
  const timerSeconds = game.config.guessTimerSeconds;
  const [timeLeft, setTimeLeft] = useState(timerSeconds);
  const fired = useRef(false);

  const opposingTeamId: TeamId = game.currentTeamId === "A" ? "B" : "A";
  const opposingMeta = WAVELENGTH_TEAM_META[opposingTeamId];
  const psychicMeta = WAVELENGTH_TEAM_META[game.currentTeamId];
  const card = game.currentCard;
  const needle = game.needlePosition;

  const timerPct = timerSeconds > 0 ? timeLeft / timerSeconds : 0;
  const timerColor = timerPct > 0.4 ? tokens.green : timerPct > 0.2 ? "#F59E0B" : tokens.red;

  useEffect(() => {
    betRef.current = bet;
  }, [bet]);

  useEffect(() => {
    if (timerSeconds <= 0) return;
    fired.current = false;
    const tick = setInterval(() => {
      setTimeLeft((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (timerSeconds <= 0 || timeLeft > 0 || fired.current) return;
    fired.current = true;
    const current = betRef.current;
    if (current) {
      set(submitOpposingBet(gameRef.current, current));
    } else {
      set({ opposingBet: null, phase: "reveal" });
    }
  }, [timeLeft]);

  function handleConfirm() {
    if (!bet) return;
    fired.current = true;
    set(submitOpposingBet(game, bet));
  }

  return (
    <Screen>
      <TopBar
        appName="Wavelength"
        right={
          <div style={{ display: "flex", gap: 8 }}>
            {game.history.length > 0 && <NavBtn onClick={() => setShowRecap(true)}>Recap</NavBtn>}
            <NavBtn onClick={() => setShowRules(true)}>Rules</NavBtn>
            <OptionsMenu onNewGame={restartGame} onExit={goHome} />
          </div>
        }
      />
      <RoundBar round={game.round} sub={`${opposingMeta.label} · Left or right of the needle?`} current="Opposing Bet" accentColor={opposingMeta.color} />

      {timerSeconds > 0 && (
        <div style={{ padding: "12px 20px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, height: 6, borderRadius: 3, background: tokens.border, overflow: "hidden" }}>
              <motion.div
                style={{ height: "100%", borderRadius: 3, background: timerColor }}
                animate={{ width: `${timerPct * 100}%` }}
                transition={{ duration: 0.9, ease: "linear" }}
              />
            </div>
            <div style={{
              fontSize: 13, fontWeight: 700, minWidth: 32, textAlign: "right",
              color: timerColor, background: timerColor + "15",
              padding: "2px 8px", borderRadius: 6, fontVariantNumeric: "tabular-nums",
              transition: "all 0.3s",
            }}>{timeLeft}s</div>
          </div>
        </div>
      )}

      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Clue callout */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card style={{ background: psychicMeta.bg, border: `1.5px solid ${psychicMeta.color}30` }}>
            <SectionLabel color={psychicMeta.color} marginBottom={6}>{psychicMeta.label}&apos;s Clue</SectionLabel>
            <div style={{ fontSize: 24, fontWeight: 800, color: tokens.black, letterSpacing: -0.5 }}>
              &ldquo;{game.clue}&rdquo;
            </div>
          </Card>
        </motion.div>

        {/* Guessing team's needle snapshot */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <SectionLabel marginBottom={12}>{psychicMeta.label}&apos;s guess</SectionLabel>
            <SpectrumDial
              left={card?.left ?? ""}
              right={card?.right ?? ""}
              color={psychicMeta.color}
              needle={needle}
            />
          </Card>
        </motion.div>

        {/* Left / Right bet */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <Card>
            <div style={{ fontSize: 13, fontWeight: 600, color: tokens.black, marginBottom: 14 }}>
              Is the target to the left or right of the needle?
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {(["left", "right"] as OpposingBet[]).map((side) => (
                <button
                  key={side}
                  onClick={() => setBet(side)}
                  style={{
                    flex: 1, padding: "18px 0", borderRadius: 12, fontSize: 17, fontWeight: 700,
                    border: `2px solid ${bet === side ? opposingMeta.color : tokens.border}`,
                    background: bet === side ? opposingMeta.bg : "transparent",
                    color: bet === side ? opposingMeta.color : tokens.grey2,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  {side === "left" ? "← Left" : "Right →"}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 12, color: tokens.grey3, marginTop: 10 }}>
              Correct = +1 point for {opposingMeta.label}
            </div>
          </Card>
        </motion.div>

        <Btn fullWidth onClick={handleConfirm} disabled={!bet} style={{ padding: "16px", fontSize: 16 }}>
          Confirm Bet →
        </Btn>
      </div>

      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
      <RecapModal isOpen={showRecap} onClose={() => setShowRecap(false)} history={game.history} />
    </Screen>
  );
}


