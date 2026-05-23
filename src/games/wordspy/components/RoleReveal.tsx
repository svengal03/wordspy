"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameState, Player } from "../types";
import { Btn, tokens, NavBtn, OptionsMenu, Screen, TopBar, RevealCover, PhaseTrail } from "@playhub/ui";
import RulesModal from "./RulesModal";
import { WORDSPY_PHASES } from "../engine";

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
    label: "Civilian",
    color: "#2563EB",
    bg: "#EDF6FF",
    border: "#BFDBFE",
    tip: "Give clues that prove you know this word — but stay vague enough that Mr. Phantom can't guess it. Find your allies!",
  },
  undercover: {
    label: "Undercover",
    color: "#CC4E00",
    bg: "#FFF3EE",
    border: "#FECDB0",
    tip: "Your word is similar but different. Blend in with the Civilians — don't expose yourself too early!",
  },
  ghost: {
    label: "Mr. Phantom",
    color: "#7C3AED",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    tip: "You have NO word. Listen to everyone's clues to figure out the secret word. If eliminated, guess it correctly to win!",
  },
};

export default function RoleReveal({ gameState, localPlayer, isOffline, revealIndex, onDone, onLeave, onNewGame }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const players = gameState.players;
  const currentPlayer = isOffline ? players[revealIndex] : localPlayer;
  const isLastPlayer = isOffline ? revealIndex === players.length - 1 : true;

  if (!currentPlayer) return null;

  return (
    <Screen style={{ display: "flex", flexDirection: "column" }}>
      <TopBar
        appName="Wordspy"
        right={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <NavBtn onClick={() => setShowRules(true)}>Rules</NavBtn>
            {onLeave && (
              <OptionsMenu onExit={onLeave} onNewGame={onNewGame} />
            )}
          </div>
        }
      />

      <PhaseTrail phases={WORDSPY_PHASES} current="Word Reveal" accentColor={tokens.coral} />

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
              {/* Role badge */}
              <div style={{ marginBottom: 12 }}>
                <span style={{
                  display: "inline-block",
                  padding: "4px 14px", borderRadius: 20,
                  background: roleInfo[currentPlayer.role].bg,
                  border: `1.5px solid ${roleInfo[currentPlayer.role].border}`,
                  fontSize: 12, fontWeight: 700,
                  color: roleInfo[currentPlayer.role].color,
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                }}>
                  {roleInfo[currentPlayer.role].label}
                </span>
              </div>

              {/* Word box */}
              <div style={{
                margin: "0 0 16px",
                background: roleInfo[currentPlayer.role].bg,
                border: `2px solid ${roleInfo[currentPlayer.role].border}`,
                borderRadius: 20,
                padding: "32px 32px",
                textAlign: "center",
                minHeight: 100,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 6,
              }}>
                {currentPlayer.role === "ghost" ? (
                  <>
                    <div style={{ fontSize: 32 }}>👻</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: roleInfo.ghost.color }}>No Word</div>
                  </>
                ) : (
                  <div style={{
                    fontSize: 40, fontWeight: 800,
                    color: tokens.black,
                    letterSpacing: -0.8,
                  }}>
                    {currentPlayer.word}
                  </div>
                )}
              </div>

              <div style={{
                fontSize: 13, color: tokens.grey2, lineHeight: 1.6, marginBottom: 20,
                background: "#FAFAFA", border: `1px solid ${tokens.border}`,
                borderRadius: 12, padding: "12px 16px", textAlign: "left",
              }}>
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
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </Screen>
  );
}
