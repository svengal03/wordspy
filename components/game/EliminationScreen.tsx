"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { GameState, Player } from "@/lib/types";
import { Card, Btn, RoleBadge, tokens, TopBar, Screen } from "@/components/ui";

interface Props {
  gameState: GameState;
  localPlayer: Player;
  onGhostGuess: (guess: string) => void;
  onContinue: () => void;
}

export default function EliminationScreen({ gameState, localPlayer, onGhostGuess, onContinue }: Props) {
  const [guess, setGuess] = useState("");
  const [guessSubmitted, setGuessSubmitted] = useState(false);

  const eliminated = gameState.players.find((p) => p.id === gameState.eliminatedThisRound);
  if (!eliminated) return null;

  const isGhost = eliminated.role === "ghost";
  const isMe = eliminated.id === localPlayer.id;

  function handleGuess() {
    if (!guess.trim()) return;
    setGuessSubmitted(true);
    onGhostGuess(guess.trim());
  }

  return (
    <Screen style={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
      <TopBar title="Eliminated!" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
          style={{ textAlign: "center", width: "100%", maxWidth: 360 }}
        >
          {/* Big emoji */}
          <div style={{ fontSize: 72, marginBottom: 12 }}>
            {isGhost ? "👻" : eliminated.role === "undercover" ? "🕵️" : "😔"}
          </div>

          <RoleBadge role={eliminated.role} />

          <div style={{ fontSize: 32, fontWeight: 800, color: tokens.black, letterSpacing: -1, marginTop: 14, marginBottom: 4 }}>
            {eliminated.name}
          </div>
          <div style={{ fontSize: 15, color: tokens.grey2, marginBottom: 20 }}>
            was voted out by the group
          </div>

          {/* Role reveal card */}
          <Card style={{ marginBottom: 20, padding: "20px 24px" }}>
            <div style={{ fontSize: 13, color: tokens.grey3, marginBottom: 6 }}>
              {eliminated.name} was the
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: eliminated.role === "civilian" ? tokens.green : eliminated.role === "ghost" ? tokens.yellow : tokens.coral }}>
              {eliminated.role === "civilian" ? "😅 Civilian!" : eliminated.role === "undercover" ? "🕵️ Undercover!" : "👻 Ghost!"}
            </div>
            {eliminated.word && (
              <div style={{ fontSize: 14, color: tokens.grey3, marginTop: 8 }}>
                Their word was: <strong style={{ color: tokens.black }}>{eliminated.word}</strong>
              </div>
            )}
          </Card>

          {/* Ghost last chance */}
          {isGhost && gameState.ghostGuessAllowed && !guessSubmitted && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ marginBottom: 20 }}
            >
              <div style={{
                background: tokens.yellowBg, border: `1.5px solid #FDE047`,
                borderRadius: 16, padding: "18px 20px",
              }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#854D0E", marginBottom: 6 }}>
                  ⚡ Last Chance — Ghost Guess!
                </div>
                <div style={{ fontSize: 13, color: "#A16207", marginBottom: 14 }}>
                  {isMe ? "Guess the Civilians' word correctly and you win!" : `${eliminated.name} gets one guess at the Civilians' word!`}
                </div>
                {isMe && (
                  <>
                    <input
                      value={guess}
                      onChange={(e) => setGuess(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleGuess()}
                      placeholder="Type your guess…"
                      autoFocus
                      style={{
                        width: "100%", padding: "11px 14px", borderRadius: 10,
                        border: `1.5px solid #FDE047`, fontSize: 15, fontFamily: "inherit",
                        background: "#fff", outline: "none", boxSizing: "border-box",
                        marginBottom: 10,
                      }}
                    />
                    <Btn fullWidth variant="warning" onClick={handleGuess} disabled={!guess.trim()}>
                      Submit Guess ⚡
                    </Btn>
                  </>
                )}
                {!isMe && (
                  <div style={{ fontSize: 13, color: "#A16207" }}>Waiting for {eliminated.name} to guess…</div>
                )}
              </div>
            </motion.div>
          )}

          {guessSubmitted && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 20 }}>
              <div style={{
                background: tokens.greenBg, border: `1.5px solid #86EFAC`,
                borderRadius: 14, padding: "14px", fontSize: 14, color: tokens.green, fontWeight: 600,
              }}>
                ✅ Guess submitted — revealing now…
              </div>
            </motion.div>
          )}

          <Btn fullWidth onClick={onContinue} variant="ghost" style={{ padding: "14px", fontSize: 15 }}>
            Continue Game →
          </Btn>
        </motion.div>
      </div>
    </Screen>
  );
}
