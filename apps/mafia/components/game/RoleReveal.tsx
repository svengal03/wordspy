"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Btn, tokens, ROLE_META, Card } from "@/components/ui";
import { useGame } from "@/lib/store";
import { MafiaRole } from "@/lib/types";
import { getMafiaTeammates } from "@/lib/gameEngine";

const ROLE_DESC: Record<MafiaRole, string> = {
  mafia: "Stay hidden. Each night, pick a Villager to eliminate. Win when your numbers match the Villagers.",
  villager: "You have no special power — only your instincts. Find and vote out all Mafia members to win.",
  doctor: "Each night, secretly protect one player. If Mafia targets them, they survive. You cannot protect the same player two nights in a row.",
  police: "Each night, secretly investigate one player. You'll learn if they are Mafia or not.",
  god: "You are the moderator. You do not play — you run the game. Keep the phone during night. Announce eliminations. Stay neutral.",
};

export default function RoleReveal() {
  const { game, set } = useGame();
  const { players, revealIndex } = game;
  const [revealed, setRevealed] = useState(false);

  const currentPlayer = players[revealIndex];
  const isLast = revealIndex === players.length - 1;
  const role = currentPlayer?.role;
  const meta = role ? ROLE_META[role] : null;
  const teammates = role === "mafia" ? getMafiaTeammates(players, currentPlayer.id) : [];
  const isGod = role === "god";

  function handleConfirm() {
    const updated = players.map((p, i) =>
      i === revealIndex ? { ...p, hasSeenRole: true } : p
    );
    setRevealed(false);
    if (isLast) {
      set({ players: updated, phase: "night", nightSubPhase: "sleeping" });
    } else {
      set({ players: updated, revealIndex: revealIndex + 1 });
    }
  }

  if (!currentPlayer) return null;

  return (
    <div style={{
      minHeight: "100dvh", background: tokens.bg,
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "24px", boxSizing: "border-box",
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>

        {/* Progress dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 28 }}>
          {players.map((_, i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: 4,
              background: i < revealIndex ? tokens.green : i === revealIndex ? tokens.coral : tokens.border,
              transition: "background .3s",
            }} />
          ))}
        </div>

        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: tokens.grey3, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>
            {revealIndex + 1} of {players.length}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!revealed ? (
            <motion.div
              key="cover"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={() => setRevealed(true)}
              style={{ cursor: "pointer" }}
            >
              <Card style={{ textAlign: "center", padding: "48px 32px", borderStyle: "dashed" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🃏</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: tokens.black, marginBottom: 8 }}>
                  {currentPlayer.name}
                </div>
                <div style={{ fontSize: 14, color: tokens.grey2 }}>Tap to reveal your role</div>
                <div style={{ fontSize: 12, color: tokens.grey3, marginTop: 8 }}>Everyone else: look away</div>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="role"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card style={{
                border: `1.5px solid ${meta ? meta.color + "40" : tokens.border}`,
                background: meta ? meta.color + "08" : tokens.card,
              }}>
                {/* Role */}
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <div style={{ fontSize: 52, marginBottom: 10 }}>{meta?.emoji ?? "❓"}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: meta?.color ?? tokens.black, marginBottom: 4, letterSpacing: -0.5 }}>
                    {meta?.label ?? "Unknown"}
                  </div>
                  <div style={{
                    display: "inline-block", padding: "4px 14px", borderRadius: 20,
                    background: meta ? meta.color + "15" : tokens.border,
                    color: meta?.color ?? tokens.grey2, fontSize: 12, fontWeight: 600,
                  }}>
                    Team: {meta?.team ?? "?"}
                  </div>
                </div>

                {/* Description */}
                <div style={{
                  background: tokens.bg, borderRadius: 14, padding: "14px 16px", marginBottom: 16,
                  fontSize: 14, color: tokens.grey1, lineHeight: 1.6,
                  border: `1px solid ${tokens.border}`,
                }}>
                  {role ? ROLE_DESC[role] : ""}
                </div>

                {/* Mafia teammates */}
                {teammates.length > 0 && (
                  <div style={{
                    background: tokens.redBg, border: `1px solid #FECACA`,
                    borderRadius: 14, padding: "12px 16px", marginBottom: 16,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: tokens.red, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                      Your Mafia team
                    </div>
                    {teammates.map((name) => (
                      <div key={name} style={{ fontSize: 14, fontWeight: 600, color: tokens.black, marginBottom: 4 }}>
                        🔪 {name}
                      </div>
                    ))}
                  </div>
                )}

                <Btn fullWidth onClick={handleConfirm}>
                  {isGod ? (isLast ? "I understand — Start →" : "I understand →") : (isLast ? "I understand — Start Night →" : "I understand →")}
                </Btn>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
