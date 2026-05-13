"use client";
import { motion, AnimatePresence } from "framer-motion";
import { tokens } from "@/components/ui";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function RulesModal({ isOpen, onClose }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.45)", zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20, overflowY: "auto",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 400, width: "100%",
              background: tokens.white, borderRadius: 20,
              border: `1.5px solid ${tokens.border}`,
              boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
              padding: "24px 20px", position: "relative",
              fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
            }}
          >
            <button
              onClick={onClose}
              style={{
                position: "absolute", top: 16, right: 16,
                width: 32, height: 32, borderRadius: 8,
                border: "none", background: tokens.border,
                color: tokens.grey2, fontSize: 16, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >✕</button>

            <div style={{ fontSize: 20, fontWeight: 800, color: tokens.black, marginBottom: 4 }}>
              How to Play
            </div>
            <div style={{ fontSize: 13, color: tokens.grey3, marginBottom: 20 }}>
              Find and eliminate the Mafia before they outnumber the Village
            </div>

            {/* Roles */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
                Roles
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { color: tokens.yellow,  bg: tokens.yellowBg,  label: "⚡ God",      desc: "The moderator. Runs the game, keeps the phone at night. Does not play." },
                  { color: tokens.red,     bg: tokens.redBg,     label: "🔪 Mafia",    desc: "Hidden killers. Each night secretly eliminate a Villager." },
                  { color: tokens.green,   bg: tokens.greenBg,   label: "🏘️ Villager", desc: "No special power — use discussion and instincts to find the Mafia." },
                  { color: tokens.blue,    bg: tokens.blueBg,    label: "💊 Doctor",   desc: "Each night secretly protect one player from elimination." },
                  { color: tokens.purple,  bg: tokens.purpleBg,  label: "🚔 Police",   desc: "Each night secretly investigate one player to learn if they're Mafia." },
                ].map((r) => (
                  <div key={r.label} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{
                      padding: "2px 10px", borderRadius: 20,
                      background: r.bg, color: r.color,
                      fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", marginTop: 1, flexShrink: 0,
                    }}>{r.label}</span>
                    <span style={{ fontSize: 13, color: tokens.grey2, lineHeight: 1.5 }}>{r.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Flow */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
                Each Round
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  "Night: Mafia picks a target. Doctor protects. Police investigates. (God handles the phone.)",
                  "Day: God announces who was eliminated. Village discusses who might be Mafia.",
                  "Vote: Village must eliminate one player by verbal vote. God records who was eliminated.",
                  "Repeat until Mafia is gone or outnumbers the Village.",
                ].map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: 6,
                      background: tokens.redBg, color: tokens.red,
                      fontSize: 11, fontWeight: 800,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, marginTop: 1,
                    }}>{i + 1}</span>
                    <span style={{ fontSize: 13, color: tokens.grey2, lineHeight: 1.5 }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Win conditions */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
                How to Win
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { label: "Village", win: "Eliminate all Mafia members" },
                  { label: "Mafia", win: "Equal or outnumber the remaining Village" },
                ].map((w) => (
                  <div key={w.label} style={{ fontSize: 13, color: tokens.grey2, lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 700, color: tokens.black }}>{w.label}:</span> {w.win}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                width: "100%", padding: "12px", borderRadius: 12,
                border: "none", background: tokens.redBg,
                color: tokens.red, fontSize: 14, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >Got it</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
