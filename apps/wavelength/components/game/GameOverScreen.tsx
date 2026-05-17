"use client";
import { motion } from "framer-motion";
import { Screen, TopBar, Card, Btn, tokens, TEAM_META, OptionsMenu, SectionLabel, ZONE_COLORS } from "@/components/ui";

const HOME_URL = process.env.NEXT_PUBLIC_HOME_URL ?? "https://playhub-home.vercel.app";
import { useGame } from "@/lib/store";

interface Props {
  onPlayAgain: () => void;
}

export default function GameOverScreen({ onPlayAgain }: Props) {
  const { game } = useGame();
  const winner = game.winner;
  const winnerMeta = winner ? TEAM_META[winner] : null;

  return (
    <Screen>
      <TopBar
        appName="Wavelength"
        title="Game Over"
        right={<OptionsMenu onNewGame={onPlayAgain} onExit={() => { window.location.href = HOME_URL; }} />}
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
                const meta = TEAM_META[t.id];
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
                  const meta = TEAM_META[r.psychicTeamId];
                  return (
                    <div key={i} style={{
                      padding: "10px 12px", borderRadius: 10,
                      background: tokens.bg, border: `1px solid ${tokens.border}`,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: meta.color }}>
                          R{r.round} · {meta.label} · {r.psychicName}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: ZONE_COLORS[r.zone] }}>
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
    </Screen>
  );
}
