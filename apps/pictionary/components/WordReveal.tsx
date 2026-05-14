"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Btn, NavBtn, OptionsMenu, Screen, TopBar, tokens } from "./ui";
import { RulesModal } from "./RulesModal";
import { RevealCover, PhaseTrail } from "@playhub/ui";
import type { Difficulty } from "@/lib/types";

const DIFFICULTY_META: Record<Difficulty, { label: string; color: string; bg: string; pts: string; sub: string }> = {
  easy:   { label: "Easy",   color: "#2BB34A", bg: "#F0FFF4", pts: "1 pt",   sub: "flat" },
  medium: { label: "Medium", color: "#F59E0B", bg: "#FFFBEB", pts: "1–3 pts", sub: "time bonus" },
  hard:   { label: "Hard",   color: "#E84040", bg: "#FFF0F0", pts: "2–5 pts", sub: "time bonus" },
};

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
const PHASES = ["Word Reveal", "Drawing", "Results"];

interface Props {
  drawerName: string;
  teamName: string;
  teamColor: string;
  wordOptions: [string, string, string];
  onReady: (word: string, difficulty: Difficulty) => void;
  onNewGame: () => void;
}

export function WordReveal({ drawerName, teamName, teamColor, wordOptions, onReady, onNewGame }: Props) {
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
        right={
          <div style={{ display: "flex", gap: 8 }}>
            <NavBtn onClick={() => setShowRules(true)}>Rules</NavBtn>
            <OptionsMenu onNewGame={onNewGame} onExit={() => { window.location.href = process.env.NEXT_PUBLIC_HOME_URL ?? "https://playhub-home.vercel.app"; }} />
          </div>
        }
      />
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />

      <PhaseTrail phases={PHASES} current="Word Reveal" accentColor={teamColor} />

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 440 }}>
          <AnimatePresence mode="wait">
            {!revealed ? (
              <RevealCover
                key="cover"
                playerName={drawerName}
                label="Pass phone to"
                subtitle={teamName}
                lookAwayText="Everyone else look away"
                buttonLabel="Tap to see words →"
                accentColor={teamColor}
                onReveal={() => setRevealed(true)}
              />
            ) : (
              <motion.div
                key="revealed"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div style={{ marginBottom: 16, textAlign: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: tokens.grey2 }}>
                    Pick a word to draw
                  </div>
                  <div style={{ fontSize: 11, color: tokens.grey3, marginTop: 2 }}>Harder = more points</div>
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
                          display: "flex", alignItems: "center", gap: 14,
                          padding: "16px 18px", borderRadius: 16, cursor: "pointer",
                          border: `2px solid ${isSelected ? meta.color : tokens.border}`,
                          background: isSelected ? meta.bg : tokens.white,
                          fontFamily: "inherit", textAlign: "left", transition: "all 0.15s",
                          boxShadow: isSelected ? `0 0 0 3px ${meta.color}18` : "none",
                        }}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                          background: isSelected ? meta.color : "#F5F5F0",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, fontWeight: 800, color: isSelected ? "#fff" : meta.color,
                          transition: "all 0.15s",
                        }}>
                          {meta.pts.split(" ")[0]}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: meta.color, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 1 }}>
                            {meta.label}
                          </div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: tokens.black, letterSpacing: -0.3 }}>
                            {word}
                          </div>
                        </div>
                        {isSelected && (
                          <div style={{ fontSize: 18, color: meta.color }}>✓</div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <Btn fullWidth color={teamColor} onClick={handleStart} disabled={!selected} style={{ padding: "16px", fontSize: 16 }}>
                  Start Drawing →
                </Btn>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Screen>
  );
}
