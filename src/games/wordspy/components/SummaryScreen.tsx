"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { GameState, Player } from "../types";
import { Card, Btn, tokens, TopBar, Screen, Badge, NavBtn, PhaseTrail, OptionsMenu, useGoHome } from "@playhub/ui";
import RulesModal from "./RulesModal";
import { WORDSPY_PHASES } from "../engine";

interface Props {
  gameState: GameState;
  localPlayer: Player;
  onPlayAgain: () => void;
}

const winnerConfig = {
  civilians: { emoji: "🥳", label: "Civilians Win!", color: tokens.green, bg: tokens.greenBg },
  undercover: { emoji: "🕵️", label: "Undercover Wins!", color: tokens.coral, bg: tokens.coralBg },
  ghost: { emoji: "👻", label: "Mr. Phantom Wins!", color: tokens.yellow, bg: tokens.yellowBg },
};

export default function SummaryScreen({ gameState, localPlayer, onPlayAgain }: Props) {
  const [showRules, setShowRules] = useState(false);
  const goHome = useGoHome();
  const winner = gameState.winner!;
  const wc = winnerConfig[winner];

  const sortedPlayers = [...gameState.players].sort((a, b) => {
    if (!a.isEliminated && b.isEliminated) return -1;
    if (a.isEliminated && !b.isEliminated) return 1;
    return 0;
  });

  return (
    <Screen>
      <TopBar
        appName="Wordspy"
        title="Game Over"
        sub="Here's how it went"
        right={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <NavBtn onClick={() => setShowRules(true)}>Rules</NavBtn>
            <OptionsMenu onNewGame={onPlayAgain} onExit={goHome} />
          </div>
        }
      />
      <PhaseTrail phases={WORDSPY_PHASES} current="Results" accentColor={tokens.coral} />
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14, maxWidth: 480, margin: "0 auto" }}>

        {/* Winner banner */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 180 }}>
          <Card style={{ background: wc.bg, border: `2px solid ${wc.color}30`, textAlign: "center", padding: "32px 24px" }}>
            <div style={{ fontSize: 60, marginBottom: 12 }}>{wc.emoji}</div>
            <Badge color={wc.color}>{wc.label}</Badge>
            {gameState.wordPair && (
              <div style={{ fontSize: 22, fontWeight: 800, color: tokens.black, marginTop: 14, letterSpacing: -0.5 }}>
                The word was <span style={{ color: wc.color }}>{gameState.wordPair.civilian}</span>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Word pair reveal */}
        {gameState.wordPair && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card style={{ background: tokens.coralBg, border: `1.5px solid ${tokens.coralBorder}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: tokens.coral, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14 }}>
                🔍 Word Pair Revealed
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
                <div style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ fontSize: 11, color: tokens.grey3, marginBottom: 4 }}>Civilians had</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: tokens.black }}>{gameState.wordPair.civilian}</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: tokens.grey3 }}>vs</div>
                <div style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ fontSize: 11, color: tokens.grey3, marginBottom: 4 }}>Undercover had</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: tokens.coral }}>{gameState.wordPair.undercover}</div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Player results */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14 }}>
              Player Results
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {sortedPlayers.map((p, i) => {
                const isMe = p.id === localPlayer.id;
                const roleEmoji = p.role === "civilian" ? "🎭" : p.role === "undercover" ? "🕵️" : "👻";
                return (
                  <div key={p.id} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 0",
                    borderBottom: i < sortedPlayers.length - 1 ? `1px solid ${tokens.border}` : "none",
                    opacity: p.isEliminated ? 0.7 : 1,
                  }}>
                    <div style={{ fontSize: 22 }}>{roleEmoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: tokens.black }}>
                        {p.name}{isMe ? " (you)" : ""}
                      </div>
                      <div style={{ fontSize: 12, color: tokens.grey3 }}>{{ civilian: "Civilian", undercover: "Undercover", ghost: "Mr. Phantom" }[p.role]}</div>
                    </div>
                    <div style={{
                      fontSize: 12, fontWeight: 600,
                      color: p.isEliminated ? tokens.red : tokens.green,
                    }}>
                      {p.isEliminated ? "Eliminated" : "Survived ✅"}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center" }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: tokens.coral }}>{gameState.round}</div>
                <div style={{ fontSize: 12, color: tokens.grey3 }}>Rounds</div>
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: tokens.coral }}>{gameState.players.length}</div>
                <div style={{ fontSize: 12, color: tokens.grey3 }}>Players</div>
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: tokens.coral }}>
                  {gameState.players.filter(p => p.isEliminated).length}
                </div>
                <div style={{ fontSize: 12, color: tokens.grey3 }}>Eliminated</div>
              </div>
            </div>
          </Card>
        </motion.div>

        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="ghost" onClick={goHome} style={{ flex: 1, padding: "14px" }}>← PlayHub</Btn>
          <Btn onClick={onPlayAgain} style={{ flex: 1, padding: "14px" }}>Play Again →</Btn>
        </div>
      </div>
    </Screen>
  );
}
