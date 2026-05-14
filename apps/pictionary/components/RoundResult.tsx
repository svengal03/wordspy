"use client";
import { motion } from "framer-motion";
import { Btn, Card, OptionsMenu, Screen, TopBar, tokens } from "./ui";
import type { Difficulty } from "@/lib/types";
import { DIFFICULTY_LABEL, DIFFICULTY_COLOR } from "@playhub/core";
import { PhaseTrail } from "@playhub/ui";

const PIC_PHASES = ["Word Reveal", "Drawing", "Results"];

interface Team {
  name: string;
  score: number;
  players: string[];
  drawerIdx: number;
}

interface Props {
  correct: boolean;
  word: string;
  difficulty: Difficulty | null;
  teams: Team[];
  teamColors: string[];
  actingTeamName?: string;
  onNext: () => void;
  onEndGame: () => void;
  onNewGame: () => void;
}

export function RoundResult({ correct, word, difficulty, teams, teamColors, actingTeamName, onNext, onEndGame, onNewGame }: Props) {
  return (
    <Screen style={{ display: "flex", flexDirection: "column" }}>
      <TopBar right={<OptionsMenu onNewGame={onNewGame} onExit={() => { window.location.href = process.env.NEXT_PUBLIC_HOME_URL ?? "https://playhub-home.vercel.app"; }} />} />
      <PhaseTrail phases={PIC_PHASES} current="Results" accentColor={teamColors[0]} />

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
              {correct && actingTeamName && (
                <div style={{ fontSize: 13, color: tokens.grey2, marginBottom: 6 }}>
                  <strong style={{ color: tokens.black }}>{actingTeamName}</strong> guessed it
                </div>
              )}
              <div style={{ fontSize: 14, color: tokens.grey2, marginBottom: difficulty ? 6 : 0 }}>
                The word was <strong style={{ color: tokens.black }}>{word}</strong>
              </div>
              {difficulty && (
                <div style={{
                  display: "inline-block",
                  fontSize: 11, fontWeight: 700, color: DIFFICULTY_COLOR[difficulty],
                  background: DIFFICULTY_COLOR[difficulty] + "15",
                  borderRadius: 6, padding: "3px 8px", letterSpacing: 0.4,
                  textTransform: "uppercase",
                }}>
                  {DIFFICULTY_LABEL[difficulty]}
                </div>
              )}
            </Card>
          </motion.div>

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
            <Btn fullWidth color={teamColors[0]} onClick={onNext} style={{ padding: "15px", borderRadius: 12 }}>
              Next Round →
            </Btn>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="ghost" fullWidth onClick={onNewGame} style={{ padding: "13px", borderRadius: 12 }}>New Game</Btn>
              <Btn variant="ghost" fullWidth onClick={onEndGame} style={{ padding: "13px", borderRadius: 12 }}>End Game</Btn>
            </div>
          </div>
        </div>
      </div>
    </Screen>
  );
}
