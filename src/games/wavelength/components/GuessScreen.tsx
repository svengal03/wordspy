"use client";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Screen, TopBar, Card, Btn, NavBtn, tokens, OptionsMenu, useGoHome } from "@playhub/ui";
import { WAVELENGTH_TEAM_META } from "@playhub/core";
import { useGame } from "../store";
import { lockNeedle } from "../engine";
import { RoundBar, SectionLabel } from "./ui";
import RulesModal from "./RulesModal";
import RecapModal from "./RecapModal";
import SpectrumDial from "./SpectrumDial";

export default function GuessScreen() {
  const { game, set, restartGame } = useGame();
  const goHome = useGoHome();
  const [needle, setNeedle] = useState(50);
  const [showRules, setShowRules] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
  const needleRef = useRef(50);
  const gameRef = useRef(game);
  gameRef.current = game;
  const timerSeconds = game.config.guessTimerSeconds;
  const [timeLeft, setTimeLeft] = useState(timerSeconds);
  const fired = useRef(false);

  const teamMeta = WAVELENGTH_TEAM_META[game.currentTeamId];
  const card = game.currentCard;
  const psychic = game.players.find((p) => p.id === game.currentPsychicId);
  const teamPlayers = game.players.filter((p) => p.teamId === game.currentTeamId && p.id !== game.currentPsychicId);

  function handleLockIn() {
    fired.current = true;
    set(lockNeedle(game, needleRef.current));
  }

  useEffect(() => {
    needleRef.current = needle;
  }, [needle]);

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
    set(lockNeedle(gameRef.current, needleRef.current));
  }, [timeLeft]);

  const timerPct = timerSeconds > 0 ? timeLeft / timerSeconds : 0;
  const timerColor = timerPct > 0.4 ? tokens.green : timerPct > 0.2 ? "#F59E0B" : tokens.red;

  function handleNeedleChange(v: number) {
    setNeedle(v);
    needleRef.current = v;
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
      <RoundBar round={game.round} sub={`${teamMeta.label} · ${psychic?.name} is the Psychic`} current="Guess" accentColor={teamMeta.color} />

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
          <Card style={{ background: teamMeta.bg, border: `1.5px solid ${teamMeta.color}30` }}>
            <SectionLabel color={teamMeta.color} marginBottom={6}>{psychic?.name}&apos;s Clue</SectionLabel>
            <div style={{ fontSize: 28, fontWeight: 800, color: tokens.black, letterSpacing: -0.5 }}>
              &ldquo;{game.clue}&rdquo;
            </div>
          </Card>
        </motion.div>

        {/* Spectrum dial — interactive */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <SectionLabel marginBottom={16}>Place your guess</SectionLabel>
            <SpectrumDial
              left={card?.left ?? ""}
              right={card?.right ?? ""}
              color={teamMeta.color}
              interactive
              needle={needle}
              onNeedleChange={handleNeedleChange}
            />
          </Card>
        </motion.div>

        {/* Who's guessing */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <Card>
            <SectionLabel marginBottom={10}>Guessing team</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {teamPlayers.map((p) => (
                <div key={p.id} style={{
                  padding: "6px 12px", borderRadius: 20, background: teamMeta.bg,
                  color: teamMeta.color, fontSize: 13, fontWeight: 600,
                }}>{p.name}</div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: tokens.grey3, marginTop: 10 }}>
              Discuss and tap the dial to your consensus — then lock in.
            </div>
          </Card>
        </motion.div>

        <Btn fullWidth onClick={handleLockIn} style={{ padding: "16px", fontSize: 16 }}>
          Lock In →
        </Btn>
      </div>

      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
      <RecapModal isOpen={showRecap} onClose={() => setShowRecap(false)} history={game.history} />
    </Screen>
  );
}


