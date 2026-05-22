"use client";
import { motion } from "framer-motion";
import { Btn, Card, NavBtn, Screen, TopBar, tokens } from "../index";
import { PhaseTrail } from "../index";

type Team = { name: string; score: number; players: string[] };

interface Props {
  teams: Team[];
  teamColors: string[];
  phases: string[];
  appName?: string;
  onPlayAgain: () => void;
  onHome?: () => void;
}

export function GameOver({ teams, teamColors, phases, appName, onPlayAgain, onHome }: Props) {
  const sorted = [...teams].sort((a, b) => b.score - a.score);
  if (sorted.length === 0) return null;
  const topScore = sorted[0]!.score;
  const tied = sorted.filter(t => t.score === topScore).length > 1;
  const winner = sorted[0]!;

  const ordinal = (n: number) => {
    if (tied && n === 0) return "Tied";
    const s = ["th", "st", "nd", "rd"], v = (n + 1) % 100;
    return `${n + 1}${s[(v - 20) % 10] || s[v] || s[0]} place`;
  };

  return (
    <Screen style={{ display: "flex", flexDirection: "column" }}>
      <TopBar appName={appName} right={<NavBtn onClick={onPlayAgain}>New Game</NavBtn>} />
      <PhaseTrail phases={phases} current="Results" accentColor={teamColors[0]} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 20px" }}>
        <div style={{ width: "100%", maxWidth: 380 }}>

          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: tokens.black, letterSpacing: -0.5, marginBottom: 6 }}>
              {tied ? "It's a tie!" : `${winner.name} wins!`}
            </div>
            <div style={{ fontSize: 14, color: tokens.grey2 }}>
              {tied ? "Nobody loses today." : "Well played."}
            </div>
          </motion.div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {sorted.map((team, i) => {
              const originalIdx = teams.indexOf(team);
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <Card style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    border: `1.5px solid ${teamColors[originalIdx]}30`,
                    padding: "16px 20px",
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: tokens.grey3, marginBottom: 2 }}>
                        {ordinal(i)}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: tokens.black }}>{team.name}</div>
                      <div style={{ fontSize: 12, color: tokens.grey3 }}>{team.players.join(", ")}</div>
                    </div>
                    <div style={{ fontSize: 32, fontWeight: 800, color: teamColors[originalIdx] }}>
                      {team.score}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            {onHome && (
              <Btn variant="ghost" fullWidth onClick={onHome} style={{ padding: "16px" }}>
                ← PlayHub
              </Btn>
            )}
            <Btn fullWidth onClick={onPlayAgain} style={{ padding: "16px" }}>
              Play Again →
            </Btn>
          </div>
        </div>
      </div>
    </Screen>
  );
}
