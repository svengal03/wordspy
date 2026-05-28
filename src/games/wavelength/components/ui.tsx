"use client";
import { tokens } from "@playhub/ui";
import { Fragment } from "react";

const PHASES = ["Clue", "Guess", "Opposing Bet", "Reveal"];

export function RoundBar({ round, sub, current, accentColor }: {
  round: number;
  sub?: string;
  current: string;
  accentColor?: string;
}) {
  const color = accentColor ?? tokens.coral;
  return (
    <div style={{
      padding: "10px 20px",
      background: tokens.bg,
      borderBottom: `0.5px solid ${tokens.divider}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: tokens.black, letterSpacing: -0.3 }}>
          Round {round}
        </div>
        {sub && <div style={{ fontSize: 12, color: tokens.grey2, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
        {PHASES.map((phase, i) => (
          <Fragment key={phase}>
            <span style={{ fontSize: 11, fontWeight: 700, color: phase === current ? color : "#CCC", letterSpacing: 0.2 }}>
              {phase}
            </span>
            {i < PHASES.length - 1 && <span style={{ fontSize: 10, color: "#D0D0D0" }}>›</span>}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

export function SectionLabel({
  children,
  color = tokens.grey3,
  marginBottom = 12,
}: {
  children: React.ReactNode;
  color?: string;
  marginBottom?: number;
}) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: 1.2, textTransform: "uppercase", marginBottom }}>
      {children}
    </div>
  );
}
