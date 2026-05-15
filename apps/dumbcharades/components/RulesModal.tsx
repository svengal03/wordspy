"use client";
import { Modal } from "@playhub/ui";
import { tokens } from "./ui";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function RulesModal({ isOpen, onClose }: Props) {
  return (
    <Modal open={isOpen} onClose={onClose}>
      <div style={{ fontSize: 20, fontWeight: 800, color: tokens.black, marginBottom: 4 }}>
        How to Play
      </div>
      <div style={{ fontSize: 13, color: tokens.grey3, marginBottom: 20 }}>
        Act it out — no talking, no sounds, no mouthing
      </div>

      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
          Picking a Word
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { color: "#2BB34A", bg: "#F0FFF4", label: "Easy", desc: "Flat 1 pt — no risk, guaranteed point" },
            { color: "#F59E0B", bg: "#FFFBEB", label: "Medium", desc: "1–3 pts based on speed — rewarded for guessing fast" },
            { color: "#E84040", bg: "#FFF0F0", label: "Hard",  desc: "2–5 pts based on speed — high floor, high ceiling" },
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

      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
          Each Round
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            "Actor privately picks Easy, Medium, or Hard",
            "No talking, no sounds, no mouthing words, no pointing at room objects",
            "Teammates shout guesses freely",
            "Hit Correct ✓ the moment someone gets it. Skip if no one does.",
          ].map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{
                width: 20, height: 20, borderRadius: 6,
                background: tokens.accentBg, color: tokens.accent,
                fontSize: 11, fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, marginTop: 1,
              }}>{i + 1}</span>
              <span style={{ fontSize: 13, color: tokens.grey2, lineHeight: 1.5 }}>{step}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
          Time Scoring
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { label: "Fast (>66% left)", pts: "full points" },
            { label: "Mid (33–66% left)", pts: "medium points" },
            { label: "Slow (<33% left)", pts: "minimum points" },
            { label: "Skip", pts: "0 pts" },
          ].map((w) => (
            <div key={w.label} style={{ fontSize: 13, color: tokens.grey2, lineHeight: 1.5 }}>
              <span style={{ fontWeight: 700, color: tokens.black }}>{w.label}:</span> {w.pts}
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onClose}
        style={{
          width: "100%", padding: "12px", borderRadius: 12,
          border: "none", background: tokens.accentBg,
          color: tokens.accent, fontSize: 14, fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit",
        }}
      >Got it</button>
    </Modal>
  );
}
