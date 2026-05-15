"use client";
import { motion, AnimatePresence } from "framer-motion";
import { tokens } from "@/components/ui";

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RulesModal({ isOpen, onClose }: RulesModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.45)", zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20, overflowY: "auto",
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="WordSpy Rules"
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
            >
              ✕
            </button>

            <div style={{ fontSize: 20, fontWeight: 800, color: tokens.black, marginBottom: 4 }}>
              How to Play
            </div>
            <div style={{ fontSize: 13, color: tokens.grey3, marginBottom: 20 }}>
              Find the Undercover and Mr. Phantom before it's too late
            </div>

            {/* Roles */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
                Roles
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { color: "#2563EB", bg: "#EDF6FF", label: "Civilian", desc: "Knows the secret word — give clues to prove it without saying it" },
                  { color: tokens.coral, bg: tokens.coralBg, label: "Undercover", desc: "Has a similar but different word — blend in and avoid getting caught" },
                  { color: "#7C3AED", bg: "#F3F0FF", label: "Mr. Phantom", desc: "Gets no word — bluff using others' clues, then guess if eliminated" },
                ].map((r) => (
                  <div key={r.label} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{
                      padding: "2px 10px", borderRadius: 20,
                      background: r.bg, color: r.color,
                      fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", marginTop: 1, flexShrink: 0,
                    }}>
                      {r.label}
                    </span>
                    <span style={{ fontSize: 13, color: tokens.grey2, lineHeight: 1.5 }}>{r.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Each Round */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
                Each Round
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  "Everyone gives one clue word about their secret word",
                  "Discuss — who seems suspicious? Who knows too much or too little?",
                  "Vote to eliminate the player you think is the Undercover or Mr. Phantom",
                  "If Mr. Phantom is eliminated, they get one chance to guess the word",
                ].map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: 6,
                      background: tokens.coralBg, color: tokens.coral,
                      fontSize: 11, fontWeight: 800,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, marginTop: 1,
                    }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: 13, color: tokens.grey2, lineHeight: 1.5 }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* How to Win */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
                How to Win
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { label: "Civilians", win: "Eliminate all Undercovers and Mr. Phantom" },
                  { label: "Undercover", win: "Outnumber the Civilians + Mr. Phantom combined" },
                  { label: "Mr. Phantom", win: "Correctly guess the civilians' word after being eliminated" },
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
                border: "none", background: tokens.coralBg,
                color: tokens.coral, fontSize: 14, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Got it
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
