"use client";
import { motion } from "framer-motion";
import { Card, Screen, TopBar, tokens } from "./ui";
import { PhaseTrail } from "@playhub/ui";

const PIC_PHASES = ["Word Reveal", "Drawing", "Results"];

interface Team {
  name: string;
  score: number;
  players: string[];
  drawerIdx: number;
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

  return (
    <Screen style={{ display: "flex", flexDirection: "column" }}>
      <TopBar title="Pictionary" sub="Game Over" />
      <PhaseTrail phases={PIC_PHASES} current="Results" accentColor={teamColors[0]} />

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
                        {i === 0 && !tied ? "1st place" : i === 1 ? "2nd place" : "3rd place"}
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

          <button
            onClick={onPlayAgain}
            style={{
              width: "100%", padding: "16px 0", borderRadius: 14, border: "none",
              background: "#4A6CF7", color: "#fff", fontSize: 16, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >Play Again</button>
        </div>
      </div>
    </Screen>
  );
}
