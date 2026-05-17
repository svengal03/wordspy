"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Screen, TopBar, Card, Btn, NavBtn, tokens, TEAM_META, OptionsMenu, SectionLabel, ZONE_COLORS, RoundBar } from "@/components/ui";

const HOME_URL = process.env.NEXT_PUBLIC_HOME_URL ?? "https://playhub-home.vercel.app";
import { useGame } from "@/lib/store";
import { resolveReveal, nextRound } from "@/lib/gameEngine";
import RulesModal from "./RulesModal";
import SpectrumDial from "./SpectrumDial";

const ZONE_LABELS: Record<string, string> = {
  bullseye: "Bullseye! 🎯",
  close: "Close! ✨",
  almost: "Almost 👍",
  miss: "Miss 😬",
};

export default function RevealScreen() {
  const { game, set, reset } = useGame();
  const [resolved, setResolved] = useState(false);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    if (!resolved) {
      const result = resolveReveal(game);
      set(result);
      setResolved(true);
    }
  }, []);

  const result = game.lastResult;
  const card = game.currentCard;
  const psychicMeta = TEAM_META[game.currentTeamId];
  const opposingTeamId = game.currentTeamId === "A" ? "B" : "A";
  const opposingMeta = TEAM_META[opposingTeamId];

  if (!result) return null;

  const zone = result.zone;
  const zoneColor = ZONE_COLORS[zone];
  const target = result.targetPosition;
  const needle = result.needlePosition;

  function handleNext() {
    if (game.winner) return;
    set(nextRound(game));
  }

  return (
    <Screen>
      <TopBar
        appName="Wavelength"
        right={
          <div style={{ display: "flex", gap: 8 }}>
            <NavBtn onClick={() => setShowRules(true)}>Rules</NavBtn>
            <OptionsMenu onNewGame={reset} onExit={() => { window.location.href = HOME_URL; }} />
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
            <SectionLabel marginBottom={6}>{result.psychicName}'s Clue</SectionLabel>
            <div style={{ fontSize: 22, fontWeight: 800, color: tokens.black }}>"{result.clue}"</div>
          </Card>
        </motion.div>

        {/* Scores */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <SectionLabel marginBottom={10}>Scores</SectionLabel>
            <div style={{ display: "flex", gap: 12 }}>
              {game.teams.map((t) => {
                const meta = TEAM_META[t.id];
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
          <Btn fullWidth onClick={handleNext} style={{ padding: "16px", fontSize: 16 }}>
            Next Round →
          </Btn>
        )}
      </div>

      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </Screen>
  );
}
