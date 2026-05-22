"use client";
import { RulesModal } from "@playhub/ui";
import { tokens } from "@playhub/ui";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function WavelengthRulesModal({ isOpen, onClose }: Props) {
  return (
    <RulesModal isOpen={isOpen} onClose={onClose} subtitle="Two teams. One spectrum. Read each other's minds.">
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
          Each Round
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            "Psychic alone sees the spectrum card and the hidden target. Everyone else looks away.",
            "Psychic gives a one-word clue hinting where on the spectrum the target sits.",
            "Their team drags the needle to a consensus position and locks in.",
            "Opposing team bets: is the target left or right of the needle? Correct = +1 pt.",
            "Target is revealed — points awarded based on how close the needle landed.",
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

      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
          Scoring
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { label: "Bullseye 🎯", pts: "4 pts", desc: "within 5% of target" },
            { label: "Close ✨", pts: "3 pts", desc: "within 15%" },
            { label: "Almost 👍", pts: "2 pts", desc: "within 25%" },
            { label: "Miss 😬", pts: "0 pts", desc: "more than 25% away" },
          ].map((row) => (
            <div key={row.label} style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{
                padding: "2px 10px", borderRadius: 20,
                background: tokens.accentBg, color: tokens.accent,
                fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0,
              }}>{row.label}</span>
              <span style={{ fontSize: 13, color: tokens.grey2 }}>{row.pts} — {row.desc}</span>
            </div>
          ))}
          <div style={{ fontSize: 13, color: tokens.grey2, lineHeight: 1.5, marginTop: 2 }}>
            <span style={{ fontWeight: 700, color: tokens.black }}>Opposing Bet:</span> +1 pt for correct left/right guess
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
          How to Win
        </div>
        <div style={{ fontSize: 13, color: tokens.grey2, lineHeight: 1.5 }}>
          First team to reach the target score wins. If tied at the end of a round, continue until one team pulls ahead.
        </div>
      </div>
    </RulesModal>
  );
}
