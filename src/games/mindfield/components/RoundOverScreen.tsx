"use client";
import { motion } from "framer-motion";
import { Btn, tokens, PlayHubLogo, OptionsMenu } from "@playhub/ui";
import type { GameState, Player } from "../types";

interface Props {
  gameState: GameState;
  localPlayer: Player;
  onNextRound: () => void;
  onLeave: () => void;
  onNewGame?: () => void;
}

export default function RoundOverScreen({ gameState, localPlayer, onNextRound, onLeave, onNewGame }: Props) {
  const winner = gameState.roundWinner!;
  const record = gameState.roundHistory[gameState.roundHistory.length - 1];
  const bombTriggered = record?.bombTriggered ?? false;
  const isHost = localPlayer.isHost;

  const winnerColor = winner === "red" ? "#DC2626" : "#2563EB";
  const winnerBg = winner === "red" ? "#FEF2F2" : "#EFF6FF";
  const winnerEmoji = winner === "red" ? "🔴" : "🔵";
  const winnerLabel = winner === "red" ? "Red" : "Blue";

  return (
    <div style={{ minHeight: "100dvh", background: tokens.bg, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ padding: "12px 16px", borderBottom: "0.5px solid rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <PlayHubLogo appName="Mind Field" />
        <OptionsMenu onExit={onLeave} onNewGame={onNewGame} />
      </div>

      <div style={{ padding: "32px 20px 24px", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            background: winnerBg, border: `2px solid ${winnerColor}30`,
            borderRadius: 20, padding: "24px 32px", textAlign: "center", width: "100%",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 8 }}>
            {bombTriggered ? "💥" : "🏆"}
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: winnerColor, letterSpacing: -0.5 }}>
            {winnerEmoji} {winnerLabel} wins!
          </div>
          <div style={{ fontSize: 14, color: tokens.grey2, marginTop: 6 }}>
            Round {gameState.round}
            {bombTriggered && " — Bomb triggered!"}
          </div>
        </motion.div>

        {/* Score breakdown */}
        {record && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ width: "100%", background: tokens.white, borderRadius: 16, padding: "16px", border: `1.5px solid ${tokens.border}` }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: tokens.grey3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Points this round</div>
            <div style={{ display: "flex", gap: 12 }}>
              <PointsCard label="🔴 Red" delta={record.redPointsEarned} total={gameState.redPoints} wins={gameState.redWins} target={gameState.config.targetWins} />
              <PointsCard label="🔵 Blue" delta={record.bluePointsEarned} total={gameState.bluePoints} wins={gameState.blueWins} target={gameState.config.targetWins} />
            </div>
            {record.winnerUsedBigClue && (
              <div style={{ marginTop: 10, fontSize: 12, color: tokens.coral, fontWeight: 600, textAlign: "center" }}>
                🔥 +200 bonus — big clue used (≥3)
              </div>
            )}
          </motion.div>
        )}

        {isHost ? (
          <Btn fullWidth onClick={onNextRound} style={{ padding: 16, fontSize: 16 }}>
            Next Round →
          </Btn>
        ) : (
          <div style={{ textAlign: "center", color: tokens.grey3, fontSize: 14 }}>
            ⏳ Waiting for host to start next round…
          </div>
        )}
      </div>
    </div>
  );
}

function PointsCard({ label, delta, total, wins, target }: { label: string; delta: number; total: number; wins: number; target: number }) {
  return (
    <div style={{
      flex: 1, textAlign: "center", padding: "12px 10px",
      background: tokens.bg, borderRadius: 12, border: `1.5px solid ${tokens.border}`,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: tokens.black, marginBottom: 4 }}>{label}</div>
      <div style={{
        fontSize: 18, fontWeight: 800,
        color: delta > 0 ? tokens.green : delta < 0 ? tokens.red : tokens.grey2,
      }}>
        {delta > 0 ? `+${delta}` : delta}
      </div>
      <div style={{ fontSize: 11, color: tokens.grey3, marginTop: 2 }}>{total} total</div>
      <div style={{ fontSize: 11, color: tokens.grey3 }}>{wins}/{target} wins</div>
    </div>
  );
}
