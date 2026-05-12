"use client";
import { motion } from "framer-motion";
import { Card, Btn, tokens, RoleBadge, ROLE_META } from "@/components/ui";
import { useGame } from "@/lib/store";

interface Props {
  onPlayAgain: () => void;
}

export default function GameOverScreen({ onPlayAgain }: Props) {
  const { game } = useGame();
  const { winner, players, eliminationHistory } = game;

  return (
    <div style={{
      minHeight: "100dvh", background: tokens.bg,
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
      paddingBottom: 48,
    }}>
      <div style={{ padding: "20px", maxWidth: 480, margin: "0 auto" }}>

        {/* Winner banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          style={{ textAlign: "center", paddingTop: 32, paddingBottom: 28 }}
        >
          <div style={{ fontSize: 72, marginBottom: 16 }}>
            {winner === "villager" ? "🏆" : "🔪"}
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: tokens.black, letterSpacing: -1, marginBottom: 10 }}>
            {winner === "villager" ? "Village wins!" : "Mafia wins!"}
          </div>
          <div style={{
            display: "inline-block", padding: "6px 18px", borderRadius: 20,
            background: winner === "villager" ? tokens.greenBg : tokens.redBg,
            color: winner === "villager" ? tokens.green : tokens.red,
            fontSize: 14, fontWeight: 600,
            border: `1px solid ${winner === "villager" ? "#BBF7D0" : "#FECACA"}`,
          }}>
            {winner === "villager" ? "All Mafia eliminated" : "Mafia outnumbered the village"}
          </div>
        </motion.div>

        {/* Full role reveal */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14 }}>
              All Roles
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {players.map((p) => {
                const meta = p.role ? ROLE_META[p.role] : null;
                return (
                  <div key={p.id} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 12px", borderRadius: 12,
                    background: p.isEliminated ? "#F5F5F5" : meta ? meta.color + "08" : "transparent",
                    border: `1px solid ${p.isEliminated ? tokens.border : meta ? meta.color + "20" : tokens.border}`,
                    opacity: p.isEliminated ? 0.65 : 1,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 9,
                      background: p.isEliminated ? "#EBEBEB" : meta ? meta.color + "20" : "#F0F0F0",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                    }}>
                      {p.isEliminated ? "💀" : (meta?.emoji ?? "?")}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: p.isEliminated ? tokens.grey2 : tokens.black }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: 12, color: meta?.color ?? tokens.grey3, fontWeight: 600 }}>
                        {meta?.label ?? "?"} · {meta?.team ?? "?"}
                      </div>
                    </div>
                    {p.isEliminated && (
                      <span style={{ fontSize: 11, color: tokens.grey3 }}>Out</span>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>

        {/* Elimination history */}
        {eliminationHistory.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 12 }}>
                Elimination order
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {eliminationHistory.map((e, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ fontSize: 14, width: 20, color: e.phase === "night" ? "#6060A0" : tokens.grey2, flexShrink: 0 }}>
                      {e.phase === "night" ? "🌙" : "☀️"}
                    </div>
                    <div style={{ flex: 1, fontSize: 13, color: tokens.grey1 }}>
                      <strong>{e.playerName}</strong>
                      <span style={{ color: tokens.grey3 }}> — Round {e.round} ({e.phase})</span>
                    </div>
                    <RoleBadge role={e.role} />
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
          style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Btn fullWidth onClick={onPlayAgain} style={{ padding: "16px", fontSize: 16 }}>
            Play Again →
          </Btn>
          <div style={{ textAlign: "center" }}>
            <a href="/" style={{ fontSize: 13, color: tokens.grey3, textDecoration: "none" }}>← PlayHub</a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
