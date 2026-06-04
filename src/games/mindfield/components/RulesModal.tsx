"use client";
import { Modal } from "@playhub/ui";
import { tokens } from "@playhub/ui";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const RULES = [
  { title: "Goal", body: "Two teams compete on a 5×5 word grid. Red needs 9 words, Blue needs 8. First team to find all their words wins the round." },
  { title: "Spymaster", body: "Sees the full colour-coded grid. Gives one clue word + a number each turn (e.g. 'River 3'). Can't use grid words as a clue." },
  { title: "Field Agents", body: "Discuss and tap words matching the Spymaster's clue. You get clueNumber + 1 guesses. Pass at any time to end your turn." },
  { title: "The Bomb", body: "One word is the Bomb. Tap it and your team instantly loses the round — and the opponent gets +800 points." },
];

export default function RulesModal({ isOpen, onClose }: Props) {
  return (
    <Modal open={isOpen} onClose={onClose} title="How to Play Mind Field">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {RULES.map((rule, i) => (
          <div key={rule.title} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6, flexShrink: 0, marginTop: 1,
              background: tokens.accentBg, color: tokens.coral,
              fontSize: 11, fontWeight: 800,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>{i + 1}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: tokens.black, marginBottom: 2 }}>{rule.title}</div>
              <div style={{ fontSize: 13, color: tokens.grey2, lineHeight: 1.5 }}>{rule.body}</div>
            </div>
          </div>
        ))}
        <div style={{ background: tokens.bg, borderRadius: 12, padding: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: tokens.grey3, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Scoring</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: tokens.grey1 }}>
            <div>Win round normally → <strong>+500 pts</strong></div>
            <div>Opponent triggers Bomb → <strong>+800 pts</strong></div>
            <div>You trigger Bomb → <strong>−300 pts</strong></div>
            <div>Win with clue ≥ 3 → <strong>+200 bonus</strong></div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
