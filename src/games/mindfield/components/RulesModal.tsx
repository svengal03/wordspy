"use client";
import { Modal } from "@playhub/ui";
import { tokens } from "@playhub/ui";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const Rule = ({ icon, title, body }: { icon: string; title: string; body: string }) => (
  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
    <div style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>{icon}</div>
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, color: tokens.black, marginBottom: 2 }}>{title}</div>
      <div style={{ fontSize: 13, color: tokens.grey2, lineHeight: 1.5 }}>{body}</div>
    </div>
  </div>
);

export default function RulesModal({ isOpen, onClose }: Props) {
  return (
    <Modal open={isOpen} onClose={onClose} title="🧠 How to Play Mind Field">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Rule
          icon="🎯"
          title="Goal"
          body="Two teams compete on a 5×5 word grid. Red needs 9 words, Blue needs 8. First team to find all their words wins the round."
        />
        <Rule
          icon="🗝️"
          title="Spymaster"
          body="Sees the full colour-coded grid. Gives one clue word + a number each turn (e.g. 'River 3'). Can't use grid words as a clue."
        />
        <Rule
          icon="👥"
          title="Field Agents"
          body="Discuss and tap words matching the Spymaster's clue. You get clueNumber + 1 guesses. Pass at any time to end your turn."
        />
        <Rule
          icon="💣"
          title="The Bomb"
          body="One word is the Bomb. Tap it and your team instantly loses the round — and the opponent gets +800 points."
        />
        <div style={{ background: tokens.bg, borderRadius: 12, padding: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: tokens.grey3, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Scoring</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: tokens.grey1 }}>
            <div>🏆 Win round normally → <strong>+500 pts</strong></div>
            <div>💥 Opponent triggers Bomb → <strong>+800 pts</strong></div>
            <div>💣 You trigger Bomb → <strong>−300 pts</strong></div>
            <div>🔥 Win with clue ≥ 3 → <strong>+200 bonus</strong></div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
