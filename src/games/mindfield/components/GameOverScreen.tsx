"use client";
import { motion } from "framer-motion";
import { Btn, tokens, PlayHubLogo, OptionsMenu } from "@playhub/ui";
import type { GameState, Player } from "../types";

interface Props {
  gameState: GameState;
  localPlayer: Player;
  onPlayAgain: () => void;
  onLeave: () => void;
}

export default function GameOverScreen({ gameState, localPlayer, onPlayAgain, onLeave }: Props) {
  const winner = gameState.winner!;
  const isHost = localPlayer.isHost;
  const winnerColor = winner === "red" ? "#DC2626" : "#2563EB";
  const winnerBg = winner === "red" ? "#FEF2F2" : "#EFF6FF";

  return (
    <div style={{ minHeight: "100dvh", background: tokens.bg, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ padding: "12px 16px", borderBottom: "0.5px solid rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <PlayHubLogo appName="Mind Field" />
        <OptionsMenu onExit={onLeave} onNewGame={isHost ? onPlayAgain : undefined} />
      </div>

      <div style={{ padding: "32px 20px 24px", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            background: winnerBg, border: `2px solid ${winnerColor}30`,
            borderRadius: 20, padding: "28px 32px", textAlign: "center", width: "100%",
          }}
        >
          <div style={{ fontSize: 56, marginBottom: 8 }}>🏆</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: winnerColor, letterSpacing: -0.5 }}>
            {winner === "red" ? "🔴 Red" : "🔵 Blue"} Wins the Game!
          </div>
          <div style={{ fontSize: 14, color: tokens.grey2, marginTop: 6 }}>
            First to {gameState.config.targetWins} rounds
          </div>
        </motion.div>

        {/* Final scores */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{ width: "100%", display: "flex", gap: 12 }}
        >
          <FinalCard
            label="🔴 Red"
            wins={gameState.redWins}
            pts={gameState.redPoints}
            isWinner={winner === "red"}
          />
          <FinalCard
            label="🔵 Blue"
            wins={gameState.blueWins}
            pts={gameState.bluePoints}
            isWinner={winner === "blue"}
          />
        </motion.div>

        {/* Round history */}
        {gameState.roundHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            style={{ width: "100%", background: tokens.white, borderRadius: 16, padding: "16px", border: `1.5px solid ${tokens.border}` }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: tokens.grey3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Round History</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {gameState.roundHistory.map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <span style={{ color: tokens.grey3, fontWeight: 600, width: 16 }}>{r.round}</span>
                  <span style={{ color: r.winner === "red" ? "#DC2626" : "#2563EB", fontWeight: 700 }}>
                    {r.winner === "red" ? "🔴 Red" : "🔵 Blue"}
                  </span>
                  {r.bombTriggered && <span style={{ fontSize: 12, color: tokens.grey3 }}>💣</span>}
                  {r.winnerUsedBigClue && <span style={{ fontSize: 12, color: tokens.coral }}>🔥</span>}
                  <span style={{ flex: 1, textAlign: "right", color: tokens.grey3 }}>
                    +{r.redPointsEarned}R / +{r.bluePointsEarned}B
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {isHost ? (
          <Btn fullWidth onClick={onPlayAgain} style={{ padding: 16, fontSize: 16 }}>
            Play Again →
          </Btn>
        ) : (
          <div style={{ textAlign: "center", color: tokens.grey3, fontSize: 14 }}>
            ⏳ Waiting for host to start a new game…
          </div>
        )}
      </div>
    </div>
  );
}

function FinalCard({ label, wins, pts, isWinner }: { label: string; wins: number; pts: number; isWinner: boolean }) {
  const winnerStyle = isWinner ? {
    border: `2px solid ${label.includes("Red") ? "#DC262650" : "#2563EB50"}`,
    boxShadow: `0 0 0 3px ${label.includes("Red") ? "#DC262615" : "#2563EB15"}`,
  } : { border: `1.5px solid ${tokens.border}` };
  return (
    <div style={{
      flex: 1, textAlign: "center", padding: "16px 12px",
      background: tokens.white, borderRadius: 14, ...winnerStyle,
    }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: tokens.black, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: tokens.black }}>{wins}</div>
      <div style={{ fontSize: 11, color: tokens.grey3 }}>rounds won</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: tokens.grey1, marginTop: 4 }}>{pts} pts</div>
    </div>
  );
}
