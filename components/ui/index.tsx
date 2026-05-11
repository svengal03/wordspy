"use client";
import { ReactNode, ButtonHTMLAttributes, useState } from "react";
import { motion } from "framer-motion";

// ─── Tokens ───────────────────────────────────────────────────────────────────
export const tokens = {
  coral: "#CC785C",
  coralLight: "#E8956D",
  coralBg: "#FFF8F5",
  coralBorder: "#CC785C30",
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
  yellow: "#CA8A04",
  yellowBg: "#FEF9C3",
};

// ─── Logo ─────────────────────────────────────────────────────────────────────
export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const s = size === "sm" ? 24 : size === "lg" ? 44 : 32;
  const fs = size === "sm" ? 12 : size === "lg" ? 22 : 16;
  const textSize = size === "sm" ? 16 : size === "lg" ? 28 : 20;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        width: s, height: s, borderRadius: s * 0.25,
        background: `linear-gradient(135deg, ${tokens.coral}, ${tokens.coralLight})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: fs, fontWeight: 800, color: "#fff", letterSpacing: -1,
        boxShadow: `0 2px 8px ${tokens.coral}40`,
      }}>W</div>
      <span style={{ fontSize: textSize, fontWeight: 700, color: tokens.black, letterSpacing: -0.5 }}>
        Wordspy
      </span>
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ children, color = tokens.coral }: { children: ReactNode; color?: string }) {
  return (
    <span style={{
      display: "inline-block", padding: "3px 12px", borderRadius: 20,
      background: color + "18", color, fontSize: 12, fontWeight: 600,
      letterSpacing: 0.3, border: `1px solid ${color}35`,
    }}>{children}</span>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────
interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger" | "secondary" | "warning";
  fullWidth?: boolean;
  children: ReactNode;
}

export function Btn({ children, variant = "primary", fullWidth, style, ...props }: BtnProps) {
  const base: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    gap: 8, padding: "13px 24px", borderRadius: 12, fontSize: 15,
    fontWeight: 600, cursor: "pointer", border: "none", fontFamily: "inherit",
    letterSpacing: -0.2, transition: "opacity .15s, transform .1s",
    width: fullWidth ? "100%" : undefined, ...style,
  };
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: `linear-gradient(135deg, ${tokens.coral}, ${tokens.coralLight})`, color: "#fff", boxShadow: `0 4px 14px ${tokens.coral}40` },
    ghost: { background: "transparent", color: tokens.grey2, border: `1.5px solid ${tokens.border}` },
    danger: { background: tokens.redBg, color: tokens.red, border: `1.5px solid #FECACA` },
    secondary: { background: "#F5F5F5", color: tokens.black },
    warning: { background: tokens.yellowBg, color: tokens.yellow, border: `1.5px solid #FDE047` },
  };
  return (
    <motion.button whileHover={{ opacity: 0.88 }} whileTap={{ scale: 0.97 }} style={{ ...base, ...variants[variant] }} {...(props as any)}>
      {children}
    </motion.button>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: tokens.card, borderRadius: 20, padding: 20,
      border: `1.5px solid ${tokens.border}`,
      boxShadow: "0 2px 16px rgba(0,0,0,0.05)", ...style,
    }}>{children}</div>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 12 }}>
      {children}
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
export function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!value)} style={{
      width: 44, height: 26, borderRadius: 13, cursor: "pointer",
      background: value ? tokens.coral : "#E5E5E5", position: "relative",
      transition: "background .2s", flexShrink: 0,
    }}>
      <div style={{
        position: "absolute", top: 3, left: value ? 21 : 3,
        width: 20, height: 20, borderRadius: 10, background: "#fff",
        transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,.2)",
      }} />
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({ name, size = 40, active, eliminated }: { name: string; size?: number; active?: boolean; eliminated?: boolean }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28,
      background: active ? tokens.coral : eliminated ? "#F5F5F5" : "#F0EDE9",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 700,
      color: active ? "#fff" : eliminated ? tokens.grey4 : tokens.grey2,
      flexShrink: 0, opacity: eliminated ? 0.5 : 1,
      border: active ? `2px solid ${tokens.coralLight}` : "2px solid transparent",
    }}>
      {name[0].toUpperCase()}
    </div>
  );
}

// ─── Screen wrapper ───────────────────────────────────────────────────────────
export function Screen({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      minHeight: "100dvh", background: tokens.bg,
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
      paddingBottom: 32, ...style,
    }}>{children}</div>
  );
}

// ─── Top Bar ──────────────────────────────────────────────────────────────────
export function TopBar({ title, sub, showLogo = true, right }: { title?: string; sub?: string; showLogo?: boolean; right?: ReactNode }) {
  return (
    <div style={{
      padding: "16px 20px 14px", borderBottom: `1px solid ${tokens.border}`,
      background: tokens.white, position: "sticky", top: 0, zIndex: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {showLogo && <Logo />}
        {right}
      </div>
      {title && (
        <div style={{ marginTop: showLogo ? 14 : 0 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: tokens.black, letterSpacing: -0.5 }}>{title}</div>
          {sub && <div style={{ fontSize: 13, color: tokens.grey2, marginTop: 2 }}>{sub}</div>}
        </div>
      )}
    </div>
  );
}

// ─── Info Box ─────────────────────────────────────────────────────────────────
export function InfoBox({ icon, title, body, color = tokens.coral }: { icon: string; title: string; body: string; color?: string }) {
  return (
    <div style={{
      background: color + "10", border: `1.5px solid ${color}25`,
      borderRadius: 14, padding: "14px 16px",
    }}>
      <div style={{ fontSize: 13, color, fontWeight: 600, marginBottom: 4 }}>{icon} {title}</div>
      <div style={{ fontSize: 13, color: tokens.grey2, lineHeight: 1.5 }}>{body}</div>
    </div>
  );
}

// ─── Options Menu ─────────────────────────────────────────────────────────────
export function OptionsMenu({ onExit, onNewGame }: { onExit: () => void; onNewGame?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Options"
        style={{
          padding: "6px 12px", borderRadius: 8,
          border: `1.5px solid ${tokens.border}`,
          background: tokens.white, cursor: "pointer",
          fontSize: 16, fontWeight: 700, color: tokens.grey1,
          fontFamily: "inherit", lineHeight: 1,
        }}
      >
        ⋮
      </button>
      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 100 }}
          />
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", right: 0,
            background: tokens.white, borderRadius: 12,
            border: `1.5px solid ${tokens.border}`,
            boxShadow: "0 4px 20px rgba(0,0,0,.12)",
            zIndex: 101, minWidth: 150, overflow: "hidden",
          }}>
            {onNewGame && (
              <button
                onClick={() => { setOpen(false); onNewGame(); }}
                style={{
                  display: "block", width: "100%", padding: "12px 16px",
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 14, fontWeight: 600, color: tokens.black,
                  textAlign: "left", fontFamily: "inherit",
                  borderBottom: `1px solid ${tokens.border}`,
                }}
              >
                New Game
              </button>
            )}
            <button
              onClick={() => { setOpen(false); onExit(); }}
              style={{
                display: "block", width: "100%", padding: "12px 16px",
                background: "none", border: "none", cursor: "pointer",
                fontSize: 14, fontWeight: 600, color: tokens.red,
                textAlign: "left", fontFamily: "inherit",
              }}
            >
              Exit Game
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────
export function Divider() {
  return <div style={{ height: 1, background: tokens.border, margin: "4px 0" }} />;
}

// ─── Role Badge ───────────────────────────────────────────────────────────────
export function RoleBadge({ role }: { role: "civilian" | "undercover" | "ghost" }) {
  const map = {
    civilian: { emoji: "🎭", label: "Civilian", color: tokens.green },
    undercover: { emoji: "🕵️", label: "Undercover", color: tokens.coral },
    ghost: { emoji: "", label: "WordSpy", color: tokens.yellow },
  };
  const { emoji, label, color } = map[role];
  return <Badge color={color}>{emoji} {label}</Badge>;
}
