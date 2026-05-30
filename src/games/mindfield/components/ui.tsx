"use client";
import { tokens } from "@playhub/ui";

export function MindFieldLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const textSize = size === "sm" ? 16 : size === "lg" ? 28 : 20;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
      <span style={{ fontSize: textSize, fontWeight: 800, color: tokens.black, letterSpacing: -0.5 }}>mind</span>
      <span style={{ fontSize: textSize, fontWeight: 800, color: tokens.coral, letterSpacing: -0.5 }}>field</span>
    </div>
  );
}

export const TEAM_COLOR = {
  red:  { bg: "#FDF5F5", text: "#8B3330", border: "#C0504D30", label: "Red" },
  blue: { bg: "#F2F6FB", text: "#2E5A8A", border: "#4A7FB530", label: "Blue" },
} as const;

export function TeamBadge({ team }: { team: "red" | "blue" }) {
  const c = TEAM_COLOR[team];
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700,
      background: c.bg, color: c.text, border: `1.5px solid ${c.border}`,
    }}>
      {c.label}
    </span>
  );
}

export function RoleBadge({ role }: { role: "spymaster" | "agent" }) {
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700,
      background: role === "spymaster" ? tokens.coralBg : tokens.bg,
      color: role === "spymaster" ? tokens.coral : tokens.grey2,
      border: `1.5px solid ${role === "spymaster" ? tokens.coralBorder : tokens.border}`,
    }}>
      {role === "spymaster" ? "Spy" : "Agent"}
    </span>
  );
}
