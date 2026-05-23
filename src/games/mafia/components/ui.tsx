"use client";
import { Badge, tokens } from "@playhub/ui";
import { MAFIA_ROLE_META } from "@playhub/core";

export function RoleBadge({ role }: { role: "mafia" | "villager" | "doctor" | "police" | "god" }) {
  const meta = MAFIA_ROLE_META[role];
  return <Badge color={meta.color}>{meta.label}</Badge>;
}
