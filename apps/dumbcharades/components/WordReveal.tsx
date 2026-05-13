"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Btn, Card, Screen, TopBar, tokens } from "./ui";
import { RulesModal } from "./RulesModal";
import type { Difficulty } from "@/lib/types";

const DIFFICULTY_META: Record<Difficulty, { label: string; color: string; bg: string; pts: string; sub: string }> = {
  easy:   { label: "Easy",   color: "#2BB34A", bg: "#F0FFF4", pts: "1 pt",   sub: "flat" },
  medium: { label: "Medium", color: "#F59E0B", bg: "#FFFBEB", pts: "1–3 pts", sub: "time bonus" },
  hard:   { label: "Hard",   color: "#E84040", bg: "#FFF0F0", pts: "2–5 pts", sub: "time bonus" },
};

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

interface Props {
  actorName: string;
  teamName: string;
  teamColor: string;
  wordOptions: [string, string, string];
  onReady: (word: string, difficulty: Difficulty) => void;
  onNewGame: () => void;
}

export function WordReveal({ actorName, teamName, teamColor, wordOptions, onReady, onNewGame }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [selected, setSelected] = useState<Difficulty | null>(null);
  const [showRules, setShowRules] = useState(false);

  function handleStart() {
    if (!selected) return;
    const word = wordOptions[DIFFICULTIES.indexOf(selected)];
    onReady(word!, selected);
  }

  return (
    <Screen style={{ display: "flex", flexDirection: "column" }}>
      <TopBar
        title="Dumb Charades"
        sub="Pick a Word"
        accent={teamColor}
        right={
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowRules(true)} style={{ padding: "6px 12px", borderRadius: 8, border: `1.5px solid ${tokens.border}`, background: tokens.white, cursor: "pointer", fontSize: 12, fontWeight: 600, color: tokens.grey1, fontFamily: "inherit" }}>Rules</button>
            <button onClick={onNewGame} style={{ padding: "6px 12px", borderRadius: 8, border: `1.5px solid ${tokens.border}`, background: tokens.white, cursor: "pointer", fontSize: 12, fontWeight: 600, color: tokens.grey2, fontFamily: "inherit" }}>New Game</button>
          </div>
        }
      />
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          <AnimatePresence mode="wait">
            {!revealed ? (
              <motion.div
                key="hidden"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card style={{ textAlign: "center", padding: "48px 32px", borderStyle: "dashed" }}>
                  <div style={{ fontSize: 12, color: tokens.grey3, marginBottom: 8 }}>Pass phone to</div>
                  <div style={{
                    background: "#F5F5F0", border: `1.5px solid ${tokens.border}`,
                    borderRadius: 14, padding: "18px 24px", marginBottom: 8,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: tokens.black, letterSpacing: -0.5 }}>
                      {actorName}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: tokens.grey3, marginBottom: 8 }}>{teamName}</div>
                  <div style={{ fontSize: 12, color: tokens.grey3, marginBottom: 24 }}>Everyone else look away</div>
                  <Btn fullWidth color={teamColor} onClick={() => setRevealed(true)} style={{ padding: "14px" }}>
                    Tap to see words
                  </Btn>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="revealed"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card style={{ padding: "28px 24px" }}>
                  <div style={{ fontSize: 12, color: tokens.grey3, marginBottom: 16, textAlign: "center" }}>
                    Pick a word — harder = more points
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                    {DIFFICULTIES.map((diff, i) => {
                      const meta = DIFFICULTY_META[diff];
                      const word = wordOptions[i];
                      const isSelected = selected === diff;
                      return (
                        <button
                          key={diff}
                          onClick={() => setSelected(diff)}
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "14px 16px", borderRadius: 12, cursor: "pointer",
                            border: `2px solid ${isSelected ? meta.color : tokens.border}`,
                            background: isSelected ? meta.bg : tokens.white,
                            fontFamily: "inherit", textAlign: "left", transition: "all 0.12s",
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: meta.color, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 2 }}>
                              {meta.label}
                            </div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: tokens.black, letterSpacing: -0.3 }}>
                              {word}
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{
                              fontSize: 12, fontWeight: 700, color: meta.color,
                              background: meta.bg, border: `1px solid ${meta.color}30`,
                              borderRadius: 8, padding: "4px 10px",
                            }}>
                              {meta.pts}
                            </div>
                            <div style={{ fontSize: 10, color: "#AAA", marginTop: 3 }}>{meta.sub}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <Btn fullWidth color={teamColor} onClick={handleStart} disabled={!selected} style={{ padding: "14px" }}>
                    Start Acting →
                  </Btn>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Screen>
  );
}
