"use client";
import { ReactNode, ButtonHTMLAttributes } from "react";
import { motion } from "framer-motion";

export const tokens = {
  black: "#1A1A1A",
  grey1: "#555",
  grey2: "#888",
  grey3: "#AAA",
  grey4: "#CCC",
  border: "#F0F0F0",
  bg: "#FAFAF8",
  white: "#FFFFFF",
  card: "#FFFFFF",
  green: "#16A34A",
  greenBg: "#F0FDF4",
  red: "#DC2626",
  redBg: "#FEF2F2",
  accent: "#E85D2F",
  accentBg: "#FFF3EF",
};

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger" | "success";
  fullWidth?: boolean;
  children: ReactNode;
  color?: string;
}

export function Btn({ children, variant = "primary", fullWidth, style, disabled, color, ...props }: BtnProps) {
  const base: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    gap: 8, padding: "13px 24px", borderRadius: 12, fontSize: 15,
    fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
    border: "none", fontFamily: "inherit", letterSpacing: -0.2,
    width: fullWidth ? "100%" : undefined, opacity: disabled ? 0.45 : 1, ...style,
  };
  const bg = color ?? tokens.accent;
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: bg, color: "#fff", boxShadow: `0 4px 14px ${bg}40` },
    ghost: { background: "transparent", color: tokens.grey2, border: `1.5px solid ${tokens.border}` },
    danger: { background: tokens.redBg, color: tokens.red, border: `1.5px solid #FECACA` },
    success: { background: tokens.greenBg, color: tokens.green, border: `1.5px solid #BBF7D0` },
  };
  return (
    <motion.button
      whileHover={disabled ? {} : { opacity: 0.88 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      style={{ ...base, ...variants[variant] }}
      disabled={disabled}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: tokens.card, borderRadius: 20, padding: 20,
      border: `1.5px solid ${tokens.border}`,
      boxShadow: "0 2px 16px rgba(0,0,0,0.05)", ...style,
    }}>{children}</div>
  );
}

export function Screen({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      minHeight: "100dvh", background: tokens.bg,
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
      paddingBottom: 32, ...style,
    }}>{children}</div>
  );
}

export function TopBar({ title, sub, right, accent }: { title: string; sub?: string; right?: ReactNode; accent?: string }) {
  return (
    <div style={{
      padding: "16px 20px 14px", borderBottom: `1px solid ${tokens.border}`,
      background: tokens.white, position: "sticky", top: 0, zIndex: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <a href="http://localhost:3000" style={{ fontSize: 11, fontWeight: 600, color: tokens.grey3, textDecoration: "none" }}>← PlayHub</a>
          <div style={{ fontSize: 16, fontWeight: 800, color: tokens.black, letterSpacing: -0.3 }}>
            {title}<span style={{ color: accent ?? tokens.accent }}>.</span>
          </div>
        </div>
        {right}
      </div>
      {sub && <div style={{ fontSize: 13, color: tokens.grey2, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 12 }}>
      {children}
    </div>
  );
}
