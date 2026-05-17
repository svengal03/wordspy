"use client";
import { Modal } from "@playhub/ui";
import { tokens } from "@/components/ui";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function RulesModal({ isOpen, onClose }: Props) {
  return (
    <Modal open={isOpen} onClose={onClose}>
      <div style={{ fontSize: 20, fontWeight: 800, color: tokens.black, marginBottom: 4 }}>How to Play Wavelength</div>
      <div style={{ fontSize: 13, color: tokens.grey3, marginBottom: 16 }}>Two teams. One spectrum. Read each other's minds.</div>
      <div style={{ overflowY: "auto", maxHeight: "65vh", display: "flex", flexDirection: "column", gap: 20, fontSize: 14, color: tokens.grey1, lineHeight: 1.6 }}>

        <section>
          <div style={{ fontWeight: 700, color: tokens.black, marginBottom: 6 }}>Overview</div>
          <p style={{ margin: 0 }}>
            Two teams compete to read each other's minds. Each round, one player — the <strong>Psychic</strong> — sees a hidden target on a spectrum between two opposites (e.g., Hot ↔ Cold). They give a one-word clue to help their team place a needle on the spectrum. First team to reach the target score wins.
          </p>
        </section>

        <section>
          <div style={{ fontWeight: 700, color: tokens.black, marginBottom: 6 }}>Each Round</div>
          <ol style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
            <li><strong>Clue:</strong> Phone goes to the Psychic alone. They see the spectrum card and the hidden target. They enter a clue.</li>
            <li><strong>Guess:</strong> Psychic's team sees the spectrum and clue. They drag the needle to their consensus position and lock in.</li>
            <li><strong>Opposing Bet:</strong> The other team decides: is the target to the <em>left</em> or <em>right</em> of the needle? Correct = +1 point.</li>
            <li><strong>Reveal:</strong> The target is revealed. Points are awarded based on how close the needle was.</li>
          </ol>
        </section>

        <section>
          <div style={{ fontWeight: 700, color: tokens.black, marginBottom: 6 }}>Scoring</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { zone: "Bullseye 🎯", pts: "4 pts", desc: "Needle within 5% of target" },
              { zone: "Close ✨", pts: "3 pts", desc: "Within 15%" },
              { zone: "Almost 👍", pts: "2 pts", desc: "Within 25%" },
              { zone: "Miss 😬", pts: "0 pts", desc: "More than 25% away" },
            ].map((row) => (
              <div key={row.zone} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "8px 12px", borderRadius: 8, background: "#F5F5F0",
              }}>
                <div>
                  <span style={{ fontWeight: 600, color: tokens.black }}>{row.zone}</span>
                  <span style={{ fontSize: 12, color: tokens.grey3, marginLeft: 8 }}>{row.desc}</span>
                </div>
                <span style={{ fontWeight: 700, color: tokens.coral }}>{row.pts}</span>
              </div>
            ))}
            <div style={{ padding: "8px 12px", borderRadius: 8, background: "#F5F5F0" }}>
              <span style={{ fontWeight: 600, color: tokens.black }}>Opposing Bet 🎲</span>
              <span style={{ fontSize: 12, color: tokens.grey3, marginLeft: 8 }}>+1 pt for correct left/right guess</span>
            </div>
          </div>
        </section>

        <section>
          <div style={{ fontWeight: 700, color: tokens.black, marginBottom: 6 }}>Psychic Tips</div>
          <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
            <li>Pick a clue that's directional — not just <em>any</em> thing that fits the spectrum.</li>
            <li>Think about what your team will associate with your clue vs. the spectrum ends.</li>
            <li>Be specific enough to land near the target, not so specific it's obvious to the opposing team.</li>
          </ul>
        </section>

        <section>
          <div style={{ fontWeight: 700, color: tokens.black, marginBottom: 6 }}>Team Tips</div>
          <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
            <li>Discuss a range first before anchoring on one position.</li>
            <li>Consider the Psychic's personality — they may tend toward extremes or midpoints.</li>
            <li>Opposing team: watch for asymmetric clues — they hint at which side of the spectrum the target is on.</li>
          </ul>
        </section>

        <section>
          <div style={{ fontWeight: 700, color: tokens.black, marginBottom: 6 }}>Winning</div>
          <p style={{ margin: 0 }}>
            First team to reach the target score wins. If both teams reach it in the same round, the team with the higher score wins. If tied, the game continues.
          </p>
        </section>
      </div>

      <button
        onClick={onClose}
        style={{
          width: "100%", padding: "12px", borderRadius: 12, marginTop: 20,
          border: "none", background: tokens.accentBg,
          color: tokens.coral, fontSize: 14, fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit",
        }}
      >Got it</button>
    </Modal>
  );
}
