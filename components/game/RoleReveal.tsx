"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameState, Player } from "@/lib/types";
import { Card, Btn, RoleBadge, tokens, InfoBox } from "@/components/ui";


interface Props {
  gameState: GameState;
  localPlayer: Player;
  isOffline: boolean;
  revealIndex: number;
  onDone: () => void; // called after all players have seen their word
}

const roleInfo = {
  civilian: {
    tip: "Give clues that prove you know this word — but stay vague enough that the Ghost can't guess it. Find your allies!",
  },
  undercover: {
    tip: "Your word is similar but different. Blend in with the Civilians — don't expose yourself too early!",
  },
  ghost: {
    tip: "You have NO word. Listen to everyone's clues carefully to figure out what the word might be. Survive and guess!",
  },
};

export default function RoleReveal({ gameState, localPlayer, isOffline, revealIndex, onDone }: Props) {
  const [revealed, setRevealed] = useState(false);
  // Online non-host players: they see their word privately but only the host advances everyone
  const [acknowledged, setAcknowledged] = useState(false);

  // In offline mode, we show each player one at a time
  const players = gameState.players;
  const currentPlayer = isOffline ? players[revealIndex] : localPlayer;
  const isLastPlayer = isOffline ? revealIndex === players.length - 1 : true;

  if (!currentPlayer) return null;

  return (
    <div style={{
      minHeight: "100dvh", background: tokens.bg,
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
      display: "flex", flexDirection: "column",
    }}>
      {/* Progress for offline */}
      {isOffline && (
        <div style={{ padding: "14px 20px 0", display: "flex", gap: 6 }}>
          {players.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i <= revealIndex ? tokens.coral : tokens.border,
              transition: "background .3s",
            }} />
          ))}
        </div>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <AnimatePresence mode="wait">
          {!revealed ? (
            <motion.div
              key="hidden"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ textAlign: "center", width: "100%", maxWidth: 360 }}
            >
              <div style={{
                width: 100, height: 100, borderRadius: 28, background: "#F5F0ED",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 44, margin: "0 auto 20px",
                border: `3px dashed ${tokens.coral}40`,
              }}>🔒</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: tokens.black, marginBottom: 6, letterSpacing: -0.5 }}>
                {isOffline ? `Pass to ${currentPlayer.name}` : "Your word is ready"}
              </div>
              <div style={{ fontSize: 15, color: tokens.grey2, marginBottom: 28, lineHeight: 1.6 }}>
                {isOffline
                  ? `Make sure nobody else can see the screen, then tap to reveal your secret word.`
                  : "Tap to reveal your secret word privately."}
              </div>
              <Btn fullWidth onClick={() => setRevealed(true)} style={{ padding: "16px", fontSize: 16 }}>
                🔍 Reveal My Word
              </Btn>
            </motion.div>
          ) : (
            <motion.div
              key="revealed"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ textAlign: "center", width: "100%", maxWidth: 360 }}
            >
              <RoleBadge role={currentPlayer.role} />
              <div style={{ marginTop: 16, fontSize: 13, color: tokens.grey3, fontWeight: 500 }}>
                {currentPlayer.role === "ghost" ? "You have no word" : "Your secret word is"}
              </div>

              <Card style={{ margin: "10px 0 16px", padding: "28px 24px" }}>
                {currentPlayer.role === "ghost" ? (
                  <div>
                    <div style={{ fontSize: 52 }}>👻</div>
                    <div style={{ fontSize: 13, color: tokens.grey3, marginTop: 12 }}>Listen carefully to everyone's clues</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 38, fontWeight: 800, color: tokens.black, letterSpacing: -1 }}>
                      {currentPlayer.word}
                    </div>
                    <div style={{ fontSize: 13, color: tokens.grey3, marginTop: 6 }}>
                      Remember this word. Don't show anyone.
                    </div>
                  </div>
                )}
              </Card>

              <InfoBox
                icon="💡"
                title={`You are a ${currentPlayer.role.charAt(0).toUpperCase() + currentPlayer.role.slice(1)}`}
                body={roleInfo[currentPlayer.role].tip}
              />

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
                  ⏳ Waiting for the host to start the round…
                </div>
              )}

              {/* Host (or offline) advances the phase for everyone */}
              {(isOffline || currentPlayer.isHost) && (
                <Btn
                  fullWidth
                  onClick={() => {
                    setRevealed(false);
                    onDone();
                  }}
                  style={{ marginTop: 16, padding: "15px", fontSize: 15 }}
                >
                  {isOffline && !isLastPlayer
                    ? `Got it — pass to ${players[revealIndex + 1]?.name} →`
                    : isOffline
                    ? "Got it — Let's Play 🎮"
                    : "Start Round →"}
                </Btn>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
