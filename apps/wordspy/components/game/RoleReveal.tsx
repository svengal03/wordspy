"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameState, Player } from "@/lib/types";
import { Btn, tokens, OptionsMenu, Screen, TopBar } from "@/components/ui";
import { RevealCover, PhaseTrail, RevealProgressDots } from "@playhub/ui";

interface Props {
  gameState: GameState;
  localPlayer: Player;
  isOffline: boolean;
  revealIndex: number;
  onDone: () => void;
  onLeave?: () => void;
  onNewGame?: () => void;
}

const roleInfo = {
  civilian: {
    tip: "Give clues that prove you know this word — but stay vague enough that Mr. Phantom can't guess it. Find your allies!",
  },
  undercover: {
    tip: "Your word is similar but different. Blend in with the Civilians — don't expose yourself too early!",
  },
  ghost: {
    tip: "You have NO word. Listen to everyone's clues to figure out the secret word. If eliminated, guess it correctly to win!",
  },
};

const PHASES = ["Role Reveal", "Clue", "Vote", "Results"];

export default function RoleReveal({ gameState, localPlayer, isOffline, revealIndex, onDone, onLeave, onNewGame }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const players = gameState.players;
  const currentPlayer = isOffline ? players[revealIndex] : localPlayer;
  const isLastPlayer = isOffline ? revealIndex === players.length - 1 : true;

  if (!currentPlayer) return null;

  return (
    <Screen style={{ display: "flex", flexDirection: "column" }}>
      <TopBar
        title="Word Reveal"
        right={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {isOffline && (
              <RevealProgressDots
                total={players.length}
                current={revealIndex}
                accentColor={tokens.coral}
                doneColor={tokens.green}
              />
            )}
            {onLeave && (
              <OptionsMenu onExit={onLeave} onNewGame={onNewGame} />
            )}
          </div>
        }
      />

      <PhaseTrail phases={PHASES} current="Role Reveal" accentColor={tokens.coral} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px 20px" }}>
        <AnimatePresence mode="wait">
          {!revealed ? (
            isOffline ? (
              <RevealCover
                key="cover"
                playerName={currentPlayer.name}
                label="Pass phone to"
                lookAwayText="Everyone else look away"
                buttonLabel="Tap to reveal word →"
                accentColor={tokens.coral}
                onReveal={() => setRevealed(true)}
              />
            ) : (
              <motion.div
                key="online-cover"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{ textAlign: "center", width: "100%", maxWidth: 440 }}
              >
                <motion.div
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  style={{ fontSize: 22, fontWeight: 800, color: tokens.coral, marginBottom: 8, letterSpacing: -0.3 }}
                >
                  Your word is ready
                </motion.div>
                <div style={{ fontSize: 13, color: tokens.grey3, marginBottom: 24 }}>Tap to reveal</div>
                <Btn fullWidth onClick={() => setRevealed(true)} style={{ padding: "16px", fontSize: 16 }}>
                  Reveal →
                </Btn>
              </motion.div>
            )
          ) : (
            <motion.div
              key="revealed"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ textAlign: "center", width: "100%", maxWidth: 440 }}
            >
              {/* Word box */}
              <div style={{
                margin: "12px 0 16px",
                background: "#F5F5F0",
                border: `1.5px solid ${tokens.border}`,
                borderRadius: 16,
                padding: "28px 32px",
                textAlign: "center",
                minHeight: 100,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{
                  fontSize: 40, fontWeight: 800,
                  color: currentPlayer.role === "ghost" ? tokens.grey3 : tokens.black,
                  letterSpacing: -0.8,
                }}>
                  {currentPlayer.role === "ghost" ? "  " : currentPlayer.word}
                </div>
              </div>

              <div style={{ fontSize: 13, color: tokens.grey3, lineHeight: 1.5, marginBottom: 20 }}>
                {roleInfo[currentPlayer.role].tip}
              </div>

              {!isOffline && !currentPlayer.isHost && !acknowledged && (
                <Btn
                  fullWidth
                  onClick={() => setAcknowledged(true)}
                  style={{ padding: "16px", fontSize: 16 }}
                >
                  Got it — I'm ready ✓
                </Btn>
              )}

              {!isOffline && !currentPlayer.isHost && acknowledged && (
                <div style={{
                  padding: "16px", borderRadius: 14,
                  background: tokens.coralBg, border: `1.5px solid ${tokens.coralBorder}`,
                  fontSize: 14, color: tokens.grey2, textAlign: "center",
                }}>
                  Waiting for the host to start the round…
                </div>
              )}

              {(isOffline || currentPlayer.isHost) && (
                <Btn
                  fullWidth
                  onClick={() => { setRevealed(false); onDone(); }}
                  style={{ padding: "16px", fontSize: 16 }}
                >
                  {isOffline && !isLastPlayer
                    ? `Pass to ${players[revealIndex + 1]?.name} →`
                    : isOffline
                    ? "Let's Play →"
                    : "Start Round →"}
                </Btn>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Screen>
  );
}
