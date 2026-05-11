"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameState, Player } from "@/lib/types";
import { Btn, RoleBadge, tokens, OptionsMenu, Screen, TopBar } from "@/components/ui";


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
    tip: "You have NO word — you're Mr. Phantom. Listen to everyone's clues carefully to figure out what the word might be. Survive and guess!",
  },
};

export default function RoleReveal({ gameState, localPlayer, isOffline, revealIndex, onDone, onLeave, onNewGame }: Props) {
  const [revealed, setRevealed] = useState(false);
  // Online non-host players: they see their word privately but only the host advances everyone
  const [acknowledged, setAcknowledged] = useState(false);

  // In offline mode, we show each player one at a time
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
              <div style={{ display: "flex", gap: 5 }}>
                {players.map((_, i) => (
                  <div key={i} style={{
                    width: 18, height: 4, borderRadius: 2,
                    background: i <= revealIndex ? tokens.coral : tokens.border,
                    transition: "background .3s",
                  }} />
                ))}
              </div>
            )}
            {onLeave && (
              <OptionsMenu onExit={onLeave} onNewGame={onNewGame} />
            )}
          </div>
        }
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px 20px" }}>
        <AnimatePresence mode="wait">
          {!revealed ? (
            <motion.div
              key="hidden"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ textAlign: "center", width: "100%", maxWidth: 360 }}
            >
              {isOffline ? (
                <>
                  <div style={{ fontSize: 12, color: tokens.grey3, marginBottom: 8 }}>Pass to</div>
                  <div style={{
                    background: "#F5F5F0",
                    border: `1.5px solid ${tokens.border}`,
                    borderRadius: 14,
                    padding: "18px 24px",
                    marginBottom: 8,
                    minHeight: 80,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <div style={{ fontSize: 32, fontWeight: 800, color: tokens.black, letterSpacing: -0.5 }}>
                      {currentPlayer.name}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: tokens.grey3, marginBottom: 20 }}>
                    Everyone else look away
                  </div>
                </>
              ) : (
                <>
                  <motion.div
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    style={{ fontSize: 20, fontWeight: 800, color: tokens.coral, marginBottom: 8, letterSpacing: -0.3 }}
                  >
                    Your word is ready
                  </motion.div>
                  <div style={{ fontSize: 13, color: tokens.grey3, marginBottom: 20 }}>Tap to reveal</div>
                </>
              )}
              <Btn fullWidth onClick={() => setRevealed(true)} style={{ padding: "14px", fontSize: 15 }}>
                Reveal →
              </Btn>
            </motion.div>
          ) : (
            <motion.div
              key="revealed"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ textAlign: "center", width: "100%", maxWidth: 360 }}
            >
              {/* Word box */}
              <div style={{
                margin: "12px 0 14px",
                background: "#F5F5F0",
                border: `1.5px solid ${tokens.border}`,
                borderRadius: 14,
                padding: "18px 24px",
                textAlign: "center",
                minHeight: 80,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: currentPlayer.role === "ghost" ? tokens.grey3 : tokens.black, letterSpacing: -0.5 }}>
                  {currentPlayer.role === "ghost" ? "  " : currentPlayer.word}
                </div>
              </div>

              <div style={{ fontSize: 12, color: tokens.grey3, lineHeight: 1.4 }}>
                {roleInfo[currentPlayer.role].tip}
              </div>

              {/* In online mode, non-hosts see their word then wait for host to start */}
              {!isOffline && !currentPlayer.isHost && !acknowledged && (
                <Btn
                  fullWidth
                  onClick={() => setAcknowledged(true)}
                  style={{ marginTop: 16, padding: "15px", fontSize: 15 }}
                >
                  Got it — I'm ready ✓
                </Btn>
              )}

              {!isOffline && !currentPlayer.isHost && acknowledged && (
                <div style={{
                  marginTop: 16, padding: "14px", borderRadius: 14,
                  background: tokens.coralBg, border: `1.5px solid ${tokens.coralBorder}`,
                  fontSize: 14, color: tokens.grey2, textAlign: "center",
                }}>
                  Waiting for the host to start the round…
                </div>
              )}

              {/* Host (or offline) advances the phase for everyone */}
              {(isOffline || currentPlayer.isHost) && (
                <Btn
                  fullWidth
                  onClick={() => { setRevealed(false); onDone(); }}
                  style={{ marginTop: 16, padding: "14px", fontSize: 15 }}
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
