"use client";
import { motion } from "framer-motion";
import { Card, Screen, TopBar, tokens } from "./ui";

interface Team {
  name: string;
  score: number;
  players: string[];
  actorIdx: number;
}

interface Props {
  correct: boolean;
  word: string;
  teams: Team[];
  teamColors: string[];
  onNext: () => void;
  onEndGame: () => void;
}

export function RoundResult({ correct, word, teams, teamColors, onNext, onEndGame }: Props) {
  return (
    <Screen style={{ display: "flex", flexDirection: "column" }}>
      <TopBar title="Dumb Charades" />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px" }}>
        <div style={{ width: "100%", maxWidth: 380 }}>

          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Card style={{
              textAlign: "center", marginBottom: 16,
              background: correct ? tokens.greenBg : tokens.white,
              border: `1.5px solid ${correct ? "#BBF7D0" : tokens.border}`,
            }}>
              <div style={{
                fontSize: 22, fontWeight: 800, letterSpacing: -0.3, marginBottom: 6,
                color: correct ? tokens.green : tokens.black,
              }}>
                {correct ? "Correct!" : "Skipped"}
              </div>
              <div style={{ fontSize: 14, color: tokens.grey2 }}>
                The word was <strong style={{ color: tokens.black }}>{word}</strong>
              </div>
            </Card>
          </motion.div>

          {/* Scores */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
              {teams.map((team, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1, background: tokens.white,
                    border: `1.5px solid ${teamColors[i]}30`,
                    borderRadius: 14, padding: "16px 12px", textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 12, color: tokens.grey2, fontWeight: 500, marginBottom: 4 }}>{team.name}</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: teamColors[i] }}>{team.score}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={onNext}
              style={{
                width: "100%", padding: "15px 0", borderRadius: 12, border: "none",
                background: teamColors[0], color: "#fff", fontSize: 15, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >Next Round →</button>
            <button
              onClick={onEndGame}
              style={{
                width: "100%", padding: "13px 0", borderRadius: 12,
                border: `1.5px solid ${tokens.border}`, background: "transparent",
                color: tokens.grey2, fontSize: 14, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >End Game</button>
          </div>
        </div>
      </div>
    </Screen>
  );
}
