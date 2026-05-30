"use client";
import { Modal, tokens } from "@playhub/ui";
import { WAVELENGTH_TEAM_META, WAVELENGTH_ZONE_COLORS } from "@playhub/core";
import { RoundResult } from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  history: RoundResult[];
}

export default function RecapModal({ isOpen, onClose, history }: Props) {
  return (
    <Modal open={isOpen} onClose={onClose} title="Recap">
      {history.length === 0 ? (
        <div style={{ fontSize: 13, color: tokens.grey3, textAlign: "center", padding: "20px 0" }}>
          No rounds played yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {history.map((r, i) => {
            const meta = WAVELENGTH_TEAM_META[r.psychicTeamId];
            return (
              <div key={i} style={{
                padding: "10px 12px", borderRadius: 10,
                background: tokens.bg, border: `1px solid ${tokens.border}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: meta.color }}>
                    R{r.round} · {meta.label} · {r.psychicName}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: WAVELENGTH_ZONE_COLORS[r.zone] }}>
                    +{r.pointsScored}{r.opposingPointsScored > 0 ? ` (+${r.opposingPointsScored})` : ""}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: tokens.black, fontWeight: 600 }}>
                  &ldquo;{r.clue}&rdquo; — {r.cardLeft} ↔ {r.cardRight}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <button
        onClick={onClose}
        style={{
          marginTop: 20, width: "100%", padding: "12px 0",
          background: tokens.accentBg, color: tokens.accent,
          border: "none", borderRadius: 12,
          fontSize: 14, fontWeight: 700, cursor: "pointer",
        }}
      >
        Close
      </button>
    </Modal>
  );
}
