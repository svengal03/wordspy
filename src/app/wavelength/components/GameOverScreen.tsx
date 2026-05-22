"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Screen, TopBar, Card, Btn, tokens, NavBtn, OptionsMenu, useGoHome } from "@playhub/ui";
import RulesModal from "./RulesModal";
import { WAVELENGTH_TEAM_META, WAVELENGTH_ZONE_COLORS } from "@playhub/core";
import { useGame } from "../lib/store";
import { SectionLabel } from "./ui";

interface Props {
  onPlayAgain: () => void;
}

export default function GameOverScreen({ onPlayAgain }: Props) {
  const { game } = useGame();
  const goHome = useGoHome();
  const winner = game.winner;
  const [showRules, setShowRules] = useState(false);
  const winnerMeta = winner ? WAVELENGTH_TEAM_META[winner] : null;

  return (
    <Screen>
      <TopBar
        appName="Wavelength"
        title="Game Over"
        right={
          <div style={{ display: "flex", gap: 8 }}>
            <NavBtn onClick={() => setShowRules(true)}>Rules</NavBtn>
            <OptionsMenu onNewGame={onPlayAgain} onExit={goHome} />
          </div>
        }
      />

      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Winner banner */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Card style={{
            textAlign: "center",
            background: winnerMeta ? winnerMeta.bg : tokens.bg,
            borderTop: `4px solid ${winnerMeta?.color ?? tokens.grey2}`,
          }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🏆</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: winnerMeta?.color ?? tokens.black, letterSpacing: -0.5 }}>
              {winnerMeta ? `${winnerMeta.label} wins!` : "It's a draw!"}
            </div>
            <div style={{ fontSize: 14, color: tokens.grey2, marginTop: 6 }}>
              {game.round} rounds played
            </div>
          </Card>
        </motion.div>

        {/* Final scores */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <SectionLabel>Final Scores</SectionLabel>
            <div style={{ display: "flex", gap: 12 }}>
              {game.teams.map((t) => {
                const meta = WAVELENGTH_TEAM_META[t.id];
                return (
                  <div key={t.id} style={{
                    flex: 1, textAlign: "center", padding: "14px 10px", borderRadius: 12,
                    background: meta.bg,
                    border: winner === t.id ? `2px solid ${meta.color}` : "1.5px solid transparent",
                  }}>
                    {winner === t.id && <div style={{ fontSize: 16, marginBottom: 4 }}>🏆</div>}
                    <div style={{ fontSize: 12, fontWeight: 700, color: meta.color, marginBottom: 4 }}>{meta.label}</div>
                    <div style={{ fontSize: 36, fontWeight: 800, color: tokens.black }}>{t.score}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>

        {/* Round history */}
        {game.history.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card>
              <SectionLabel>Round History</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {game.history.map((r, i) => {
                  const meta = WAVELENGTH_TEAM_META[r.psychicTeamId];
                  return (
                    <div key={i} style={{
                      padding: "10px 12px", borderRadius: 10,
                      background: tokens.bg, border: `1px solid ${tokens.border}`,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: meta.color }}>
                          R{r.round} · {meta.label} · {r.psychicName}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: WAVELENGTH_ZONE_COLORS[r.zone] }}>
                          +{r.pointsScored}
                          {r.opposingPointsScored > 0 ? ` (+${r.opposingPointsScored})` : ""}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: tokens.black, fontWeight: 600 }}>
                        "{r.clue}" — {r.cardLeft} ↔ {r.cardRight}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        )}

        <Btn fullWidth onClick={onPlayAgain} style={{ padding: "16px", fontSize: 16 }}>
          Play Again
        </Btn>
      </div>
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </Screen>
  );
}
