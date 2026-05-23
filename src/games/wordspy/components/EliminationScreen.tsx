"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { GameState, Player } from "../types";
import { Btn, tokens, TopBar, Screen, OptionsMenu, NavBtn } from "@playhub/ui";
import { RoleBadge } from "./ui";
import RulesModal from "./RulesModal";
import { checkWinCondition } from "../engine";

interface Props {
  gameState: GameState;
  localPlayer: Player;
  isOffline?: boolean;
  onGhostGuess: (guess: string) => void;
  onContinue: () => void;
  onLeave?: () => void;
  onNewGame?: () => void;
}

export default function EliminationScreen({ gameState, localPlayer, isOffline = false, onGhostGuess, onContinue, onLeave, onNewGame }: Props) {
  const [guess, setGuess] = useState("");
  const [guessSubmitted, setGuessSubmitted] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const eliminated = gameState.players.find((p) => p.id === gameState.eliminatedThisRound);
  if (!eliminated) return null;

  const isGhost = eliminated.role === "ghost";
  const isMe = eliminated.id === localPlayer.id;
  const isGameOver = !!checkWinCondition(gameState);

  function handleGuess() {
    if (!guess.trim()) return;
    setGuessSubmitted(true);
    onGhostGuess(guess.trim());
  }

  return (
    <Screen style={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
      <TopBar
        appName="Wordspy"
        title="Eliminated!"
        right={
          <div style={{ display: "flex", gap: 8 }}>
            <NavBtn onClick={() => setShowRules(true)}>Rules</NavBtn>
            {onLeave && <OptionsMenu onExit={onLeave} onNewGame={onNewGame} />}
          </div>
        }
      />
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
          style={{ textAlign: "center", width: "100%", maxWidth: 360 }}
        >
          {/* Big emoji */}
          <div style={{ fontSize: 72, marginBottom: 12 }}>
            {isGhost ? "👻" : eliminated.role === "undercover" ? "🕵️" : "😤"}
          </div>

          <RoleBadge role={eliminated.role} />

          <div style={{ fontSize: 32, fontWeight: 800, color: tokens.black, letterSpacing: -1, marginTop: 14, marginBottom: 4 }}>
            {eliminated.name}
          </div>
          <div style={{ fontSize: 15, color: tokens.grey2, marginBottom: 20 }}>
            was voted out by the group
          </div>

          {/* Ghost last chance — only when Mr. Phantom is eliminated */}
          {isGhost && gameState.ghostGuessAllowed && !guessSubmitted && (isOffline || isMe) && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ marginBottom: 20, width: "100%", textAlign: "left" }}
            >
              <div style={{
                background: tokens.card, border: `1.5px solid ${tokens.border}`,
                borderRadius: tokens.radius.xl, padding: "18px 20px",
                boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 }}>
                  Last Chance
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: tokens.black, marginBottom: 4 }}>
                  Guess the civilians&apos; word
                </div>
                <div style={{ fontSize: 13, color: tokens.grey2, marginBottom: 14 }}>
                  Guess correctly and you win as Mr. Phantom!
                </div>
                <input
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGuess()}
                  placeholder="Type your guess…"
                  autoFocus
                  style={{
                    width: "100%", padding: "12px 14px", borderRadius: tokens.radius.md,
                    border: `1.5px solid ${tokens.coral}`, fontSize: 15, fontFamily: "inherit",
                    background: tokens.white, outline: "none", boxSizing: "border-box",
                    marginBottom: 12,
                  }}
                />
                <Btn fullWidth onClick={handleGuess} disabled={!guess.trim()}>
                  Submit Guess →
                </Btn>
              </div>
            </motion.div>
          )}

          {/* Waiting message for non-ghost players while ghost decides */}
          {isGhost && gameState.ghostGuessAllowed && !guessSubmitted && !isOffline && !isMe && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 16 }}>
              <div style={{
                background: tokens.yellowBg, border: `1.5px solid #FDE047`,
                borderRadius: 14, padding: "14px", fontSize: 14, color: "#854D0E", fontWeight: 600, textAlign: "center",
              }}>
                👻 Waiting for {eliminated.name} to guess…
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

          {/* Host can skip the ghost guess / continue after a non-ghost elimination */}
          {(localPlayer.isHost || isOffline) && (!isGhost || guessSubmitted || !gameState.ghostGuessAllowed) && (
            <Btn fullWidth onClick={onContinue} variant="ghost" style={{ padding: "14px", fontSize: 15 }}>
              {isGameOver ? "See Results →" : "Continue Game →"}
            </Btn>
          )}

          {/* Host can skip ghost guess if needed */}
          {isGhost && gameState.ghostGuessAllowed && !guessSubmitted && !isMe && (localPlayer.isHost || isOffline) && (
            <Btn fullWidth onClick={onContinue} variant="ghost" style={{ padding: "14px", fontSize: 15, marginTop: 8, opacity: 0.7 }}>
              Skip Mr. Phantom Guess →
            </Btn>
          )}

          {/* Non-host waiting message */}
          {!localPlayer.isHost && !isOffline && (!isGhost || !gameState.ghostGuessAllowed || guessSubmitted) && (
            <div style={{ fontSize: 13, color: tokens.grey3, textAlign: "center", padding: "8px 0" }}>
              Waiting for host to continue…
            </div>
          )}
        </motion.div>
      </div>
    </Screen>
  );
}
