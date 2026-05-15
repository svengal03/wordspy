"use client";
export * from "@playhub/ui";
import { tokens, Badge } from "@playhub/ui";

export const ROLE_META = {
  mafia: { label: "Mafia", emoji: "🔪", color: tokens.red, bg: tokens.redBg, team: "Mafia" },
  villager: { label: "Villager", emoji: "🏘️", color: tokens.green, bg: tokens.greenBg, team: "Village" },
  doctor: { label: "Doctor", emoji: "💊", color: tokens.blue, bg: tokens.blueBg, team: "Village" },
  police: { label: "Police", emoji: "🚔", color: tokens.purple, bg: tokens.purpleBg, team: "Village" },
  god: { label: "God", emoji: "⚡", color: tokens.yellow, bg: tokens.yellowBg, team: "Neutral" },
};

export function RoleBadge({ role }: { role: "mafia" | "villager" | "doctor" | "police" | "god" }) {
  const meta = ROLE_META[role];
  return <Badge color={meta.color}>{meta.label}</Badge>;
}
