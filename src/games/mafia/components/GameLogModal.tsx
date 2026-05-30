"use client";
import { Modal } from "@playhub/ui";
import { tokens } from "@playhub/ui";
import { RoundEvent, MafiaRole } from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  roundHistory: RoundEvent[];
}

function roleLabel(role: MafiaRole | null) {
  if (role === "villager") return "Villager";
  if (role === "police") return "Police";
  if (role === "doctor") return "Doctor";
  if (role === "mafia") return "Mafia";
  return role ?? "";
}

export default function GameLogModal({ isOpen, onClose, roundHistory }: Props) {
  return (
    <Modal open={isOpen} onClose={onClose} title="Game Log">
      {roundHistory.length === 0 ? (
        <div style={{ fontSize: 13, color: tokens.grey3, textAlign: "center", padding: "20px 0" }}>
          No rounds played yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {roundHistory.map((e) => (
            <div key={e.round}>
              <div style={{ fontSize: 12, fontWeight: 700, color: tokens.grey2, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.8 }}>
                Round {e.round}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingLeft: 10, borderLeft: `2px solid ${tokens.border}` }}>
                {e.mafiaTargeted && (
                  <div style={{ fontSize: 13, color: tokens.grey1 }}>
                    Mafia targeted <strong>{e.mafiaTargeted}</strong>
                    {e.savedByDoctor ? " — saved by Doctor" : e.nightKilled ? " — killed" : ""}
                  </div>
                )}
                {e.doctorProtected && (
                  <div style={{ fontSize: 13, color: tokens.grey1 }}>
                    Doctor protected <strong>{e.doctorProtected}</strong>
                    {e.savedByDoctor ? " — save successful" : ""}
                  </div>
                )}
                {e.policeInvestigated && (
                  <div style={{ fontSize: 13, color: tokens.grey1 }}>
                    Police investigated <strong>{e.policeInvestigated}</strong> —{" "}
                    <span style={{ fontWeight: 700, color: e.policeFoundMafia ? tokens.red : tokens.green }}>
                      {e.policeFoundMafia ? "Mafia" : "Not Mafia"}
                    </span>
                  </div>
                )}
                {e.dayVotedOut && (
                  <div style={{ fontSize: 13, color: tokens.grey1 }}>
                    Town voted out <strong>{e.dayVotedOut}</strong> ({roleLabel(e.dayVotedOutRole)})
                  </div>
                )}
                {!e.mafiaTargeted && !e.dayVotedOut && (
                  <div style={{ fontSize: 13, color: tokens.grey3 }}>No actions this round</div>
                )}
              </div>
            </div>
          ))}
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
