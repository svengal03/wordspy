"use client";

export const tokens = {
  // Brand
  coral: "#CC785C",
  coralLight: "#E8956D",
  coralDark: "#993C1D",
  coralStrong: "#D85A30",
  coralBg: "#FFF6F0",
  coralBorder: "#CC785C30",
  accent: "#CC785C",
  accentBg: "#FAECE7",

  // Text — WCAG AA on white
  black: "#1A1A1A",
  grey1: "#525252",   // 7.6:1
  grey2: "#6B6B6B",   // 5.4:1 — body text
  grey3: "#8A8A8A",   // 4.2:1 — secondary
  grey4: "#BDBDBD",   // outlines / placeholders

  // Surfaces — warm neutrals to harmonize with coral
  bg: "#FAF6F0",
  card: "#FFFFFF",
  white: "#FFFFFF",
  border: "#EBE4DA",
  inputBg: "#F5EFE6",
  iconBg: "#F1E9DC",
  avatarBg: "#EDE4D5",
  divider: "rgba(60, 40, 20, 0.10)",

  // Featured / promo
  featuredBg: "#FAECE7",
  featuredBorder: "#D85A30",
  featuredAccent: "#F5C4B3",

  // Semantic
  green: "#16A34A",
  greenBg: "#F0FDF4",
  red: "#DC2626",
  redBg: "#FEF2F2",
  yellow: "#CA8A04",
  yellowBg: "#FEF9C3",
  blue: "#2563EB",
  blueBg: "#EFF6FF",
  purple: "#7C3AED",
  purpleBg: "#F5F3FF",

  // Shadows — warm undertone for cohesion with coral
  shadow: {
    sm: "0 1px 2px rgba(80, 50, 30, 0.06)",
    md: "0 2px 12px rgba(80, 50, 30, 0.08)",
    lg: "0 8px 28px rgba(80, 50, 30, 0.12)",
    coral: "0 4px 14px rgba(204, 120, 92, 0.28)",
  } as const,

  // Disabled
  disabledBg: "#EFE9DF",
  disabledFg: "#A8A29A",

  space: { 1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32, 7: 48 } as const,
  radius: { sm: 6, md: 10, lg: 14, xl: 20, full: 9999 } as const,
  zIndex: { topbar: 50, dropdown: 100, backdrop: 150, modal: 200 } as const,
  font: { h1: 28, h2: 22, h3: 18, h4: 16, body: 14, label: 12, caption: 11 } as const,
  iconSize: { sm: 32, md: 40, lg: 48, xl: 56 } as const,
};
