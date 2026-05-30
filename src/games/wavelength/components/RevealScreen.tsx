"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Screen, TopBar, Card, Btn, NavBtn, tokens, OptionsMenu, useGoHome } from "@playhub/ui";
import { WAVELENGTH_TEAM_META, WAVELENGTH_ZONE_COLORS } from "@playhub/core";
import { useGame } from "../store";
import { resolveReveal, nextRound } from "../engine";
import { RoundBar, SectionLabel } from "./ui";
import RulesModal from "./RulesModal";
import RecapModal from "./RecapModal";
import SpectrumDial from "./SpectrumDial";

const ZONE_LABELS: Record<string, string> = {
  bullseye: "Bullseye! 🎯",
  close: "Close! ✨",
  almost: "Almost 👍",
  miss: "Miss 😬",
};

export default function RevealScreen() {
  const { game, set, restartGame } = useGame();
  const goHome = useGoHome();
  const resolvedRef = useRef(false);
  const [showRules, setShowRules] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  useEffect(() => {
    // useRef survives React Strict Mode double-invoke; useState would reset and score twice
    if (!resolvedRef.current) {
      resolvedRef.current = true;
      set(resolveReveal(game));
    }
  }, []);

  const result = game.lastResult;
  const card = game.currentCard;
  const psychicMeta = WAVELENGTH_TEAM_META[game.currentTeamId];
  const opposingTeamId = game.currentTeamId === "A" ? "B" : "A";
  const opposingMeta = WAVELENGTH_TEAM_META[opposingTeamId];

  if (!result) return null;

  const zone = result.zone;
  const zoneColor = WAVELENGTH_ZONE_COLORS[zone];
  const target = result.targetPosition;
  const needle = result.needlePosition;

  async function handleNext() {
    if (game.winner || advancing) return;
    setAdvancing(true);
    set(await nextRound(game));
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
      <RoundBar round={game.round} sub={`${psychicMeta.label} · ${result?.psychicName}'s round`} current="Reveal" accentColor={psychicMeta.color} />

      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Result badge */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Card style={{ textAlign: "center", borderTop: `4px solid ${zoneColor}` }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: zoneColor, letterSpacing: -0.5 }}>
              {ZONE_LABELS[zone]}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: tokens.black, marginTop: 4 }}>
              +{result.pointsScored} pts for {psychicMeta.label}
            </div>
            {result.opposingBet && (
              <div style={{
                marginTop: 10, fontSize: 14, fontWeight: 600,
                color: result.opposingBetCorrect ? tokens.green : tokens.red,
              }}>
                {opposingMeta.label} bet {result.opposingBet} →{" "}
                {result.opposingBetCorrect ? `Correct! +${result.opposingPointsScored} pt` : "Wrong — 0 pts"}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Spectrum reveal */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <SpectrumDial
              left={card?.left ?? result.cardLeft}
              right={card?.right ?? result.cardRight}
              color={psychicMeta.color}
              showZones
              target={target}
              needle={needle}
            />
            <div style={{ display: "flex", gap: 16, fontSize: 11, marginTop: 8, justifyContent: "center" }}>
              <span style={{ color: psychicMeta.color }}>● Guess</span>
              <span style={{ color: tokens.black }}>● Target</span>
            </div>
          </Card>
        </motion.div>

        {/* Clue recap */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <SectionLabel marginBottom={6}>{result.psychicName}&apos;s Clue</SectionLabel>
            <div style={{ fontSize: 22, fontWeight: 800, color: tokens.black }}>&ldquo;{result.clue}&rdquo;</div>
          </Card>
        </motion.div>

        {/* Scores */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <SectionLabel marginBottom={10}>Scores</SectionLabel>
            <div style={{ display: "flex", gap: 12 }}>
              {game.teams.map((t) => {
                const meta = WAVELENGTH_TEAM_META[t.id];
                return (
                  <div key={t.id} style={{
                    flex: 1, textAlign: "center", padding: "10px", borderRadius: 10,
                    background: meta.bg,
                    border: game.winner === t.id ? `2px solid ${meta.color}` : "none",
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: meta.color, marginBottom: 4 }}>{meta.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: tokens.black }}>{t.score}</div>
                    <div style={{ fontSize: 11, color: tokens.grey3 }}>/ {game.config.targetScore}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>

        {game.winner ? (
          <Btn fullWidth onClick={() => set({ phase: "game-over" })} style={{ padding: "16px", fontSize: 16 }}>
            See Final Results →
          </Btn>
        ) : (
          <Btn fullWidth onClick={handleNext} disabled={advancing} style={{ padding: "16px", fontSize: 16 }}>
            {advancing ? "Loading…" : "Next Round →"}
          </Btn>
        )}
      </div>

      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
      <RecapModal isOpen={showRecap} onClose={() => setShowRecap(false)} history={game.history} />
    </Screen>
  );
}


