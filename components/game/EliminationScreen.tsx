"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { GameState, Player } from "@/lib/types";
import { Card, Btn, RoleBadge, tokens, TopBar, Screen } from "@/components/ui";
import RulesModal from "./RulesModal";

interface Props {
  gameState: GameState;
  localPlayer: Player;
  isOffline?: boolean;
  onGhostGuess: (guess: string) => void;
  onContinue: () => void;
}

export default function EliminationScreen({ gameState, localPlayer, isOffline = false, onGhostGuess, onContinue }: Props) {
  const [guess, setGuess] = useState("");
  const [guessSubmitted, setGuessSubmitted] = useState(false);
  const [showRules, setShowRules] = useState(false);

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
      <TopBar
        title="Eliminated!"
        right={
          <button
            onClick={() => setShowRules(true)}
            style={{
              background: "none", border: "none", fontSize: 20, cursor: "pointer",
            }}
            title="Rules"
          >
            ❓
          </button>
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
            {isGhost ? "👻" : eliminated.role === "undercover" ? "🕵️" : "😔"}
          </div>

          <RoleBadge role={eliminated.role} />

          <div style={{ fontSize: 32, fontWeight: 800, color: tokens.black, letterSpacing: -1, marginTop: 14, marginBottom: 4 }}>
            {eliminated.name}
          </div>
          <div style={{ fontSize: 15, color: tokens.grey2, marginBottom: 20 }}>
            was voted out by the group
          </div>


          {/* Ghost last chance — only the eliminated ghost player can guess */}
          {isGhost && gameState.ghostGuessAllowed && !guessSubmitted && (isOffline || isMe) && (
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
                  ⚡ Last Chance — Guess the Civilians' Word!
                </div>
                <div style={{ fontSize: 13, color: "#A16207", marginBottom: 14 }}>
                  If you guess correctly, you win as the Ghost!
                </div>
                <input
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGuess()}
                  placeholder="Type the civilians' word…"
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
                👻 Waiting for {eliminated.name} to make their guess…
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
              Continue Game →
            </Btn>
          )}

          {/* Host can skip ghost guess if needed */}
          {isGhost && gameState.ghostGuessAllowed && !guessSubmitted && !isMe && (localPlayer.isHost || isOffline) && (
            <Btn fullWidth onClick={onContinue} variant="ghost" style={{ padding: "14px", fontSize: 15, marginTop: 8, opacity: 0.7 }}>
              Skip Ghost Guess →
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
