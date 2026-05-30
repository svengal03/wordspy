"use client";
import { useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Btn, Card, NavBtn, OptionsMenu, Screen, TopBar, tokens, useGoHome } from "@playhub/ui";
import { RevealCover, PhaseTrail } from "@playhub/ui";
import type { Difficulty } from "@playhub/core";

const DIFFICULTY_META: Record<Difficulty, { label: string; color: string; bg: string; pts: string; sub: string }> = {
  easy:   { label: "Easy",   color: tokens.green,  bg: tokens.greenBg,  pts: "1 pt",   sub: "flat" },
  medium: { label: "Medium", color: tokens.yellow, bg: tokens.yellowBg, pts: "1–3 pts", sub: "time bonus" },
  hard:   { label: "Hard",   color: tokens.red,    bg: tokens.redBg,    pts: "2–5 pts", sub: "time bonus" },
};

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

interface Props {
  appName: string;
  playerName: string;
  teamName: string;
  teamColor: string;
  wordOptions: [string, string, string];
  phases: string[];
  actionLabel: string;
  rulesModal: (props: { isOpen: boolean; onClose: () => void }) => ReactNode;
  onReady: (word: string, difficulty: Difficulty) => void;
  onNewGame: () => void;
}

export function WordReveal({ appName, playerName, teamName, teamColor, wordOptions, phases, actionLabel, rulesModal, onReady, onNewGame }: Props) {
  const goHome = useGoHome();
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
        appName={appName}
        right={
          <div style={{ display: "flex", gap: 8 }}>
            <NavBtn onClick={() => setShowRules(true)}>Rules</NavBtn>
            <OptionsMenu onNewGame={onNewGame} onExit={goHome} />
          </div>
        }
      />
      {rulesModal({ isOpen: showRules, onClose: () => setShowRules(false) })}

      <PhaseTrail phases={phases} current="Word Reveal" accentColor={teamColor} />

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 440 }}>
          <AnimatePresence mode="wait">
            {!revealed ? (
              <RevealCover
                key="cover"
                playerName={playerName}
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
                <Card style={{ padding: "28px 24px" }}>
                  <div style={{ fontSize: 13, color: tokens.grey3, marginBottom: 16, textAlign: "center" }}>
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
                          aria-pressed={isSelected}
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "16px 18px", borderRadius: 12, cursor: "pointer",
                            border: `2px solid ${isSelected ? meta.color : tokens.border}`,
                            background: isSelected ? meta.bg : tokens.white,
                            fontFamily: "inherit", textAlign: "left", transition: "all 0.12s",
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: meta.color, letterSpacing: 0.5, textTransform: "uppercase" }}>
                                {meta.label}
                              </div>
                              {isSelected && (
                                <span
                                  aria-hidden="true"
                                  style={{
                                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                                    width: 16, height: 16, borderRadius: "50%",
                                    background: meta.color, color: "#fff",
                                    fontSize: 9, fontWeight: 800, flexShrink: 0,
                                  }}
                                >✓</span>
                              )}
                            </div>
                            <div style={{ fontSize: 22, fontWeight: 800, color: tokens.black, letterSpacing: -0.3 }}>
                              {word}
                            </div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
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
                  <Btn fullWidth color={teamColor} onClick={handleStart} disabled={!selected} style={{ padding: "16px" }}>
                    {actionLabel}
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
