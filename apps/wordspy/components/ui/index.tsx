"use client";
export * from "@playhub/ui";
import { ReactNode } from "react";
import { tokens, Badge } from "@playhub/ui";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const textSize = size === "sm" ? 16 : size === "lg" ? 28 : 20;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
      <span style={{ fontSize: textSize, fontWeight: 800, color: tokens.black, letterSpacing: -0.5 }}>word</span>
      <span style={{ fontSize: textSize, fontWeight: 800, color: tokens.coral, letterSpacing: -0.5 }}>spy</span>
    </div>
  );
}

export function RoleBadge({ role }: { role: "civilian" | "undercover" | "ghost" }) {
  const map = {
    civilian: { emoji: "🎭", label: "Civilian", color: tokens.green },
    undercover: { emoji: "🕵️", label: "Undercover", color: tokens.coral },
    ghost: { emoji: "👻", label: "Mr. Phantom", color: tokens.yellow },
  };
  const { emoji, label, color } = map[role];
  return <Badge color={color}>{emoji} {label}</Badge>;
}
