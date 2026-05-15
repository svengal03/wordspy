"use client";
import { motion } from "framer-motion";
import { Btn, Card, NavBtn, Screen, TopBar, tokens } from "./ui";
import { PhaseTrail } from "@playhub/ui";

const DC_PHASES = ["Word Reveal", "Acting", "Results"];

interface Team {
  name: string;
  score: number;
  players: string[];
  actorIdx: number;
}

interface Props {
  teams: Team[];
  teamColors: string[];
  onPlayAgain: () => void;
}

export function GameOver({ teams, teamColors, onPlayAgain }: Props) {
  const sorted = [...teams].sort((a, b) => b.score - a.score);
  const tied = sorted[0]!.score === sorted[1]?.score;
  const winner = sorted[0]!;

  const ordinal = (n: number) => {
    if (n === 0) return "1st place";
    if (n === 1) return "2nd place";
    if (n === 2) return "3rd place";
    const s = ["th", "st", "nd", "rd"], v = (n + 1) % 100;
    return `${n + 1}${s[(v - 20) % 10] || s[v] || s[0]} place`;
  };

  return (
    <Screen style={{ display: "flex", flexDirection: "column" }}>
      <TopBar right={<NavBtn onClick={onPlayAgain}>New Game</NavBtn>} />
      <PhaseTrail phases={DC_PHASES} current="Results" accentColor={teamColors[0]} />

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
                        {i === 0 && tied ? "1st place (tie)" : ordinal(i)}
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
            <Btn variant="ghost" fullWidth onClick={() => { window.location.href = process.env.NEXT_PUBLIC_HOME_URL ?? "https://playhub-home.vercel.app"; }} style={{ padding: "16px" }}>
              ← PlayHub
            </Btn>
            <Btn fullWidth onClick={onPlayAgain} style={{ padding: "16px" }}>
              Play Again →
            </Btn>
          </div>
        </div>
      </div>
    </Screen>
  );
}
