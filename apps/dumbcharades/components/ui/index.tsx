"use client";
import { ReactNode, ButtonHTMLAttributes, useState } from "react";
import { motion } from "framer-motion";

export const tokens = {
  coral: "#CC785C",
  coralLight: "#E8956D",
  coralBg: "#FFF8F5",
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
  accent: "#CC785C",
  accentBg: "#FAECE7",
};

// ─── PlayHub Logo ─────────────────────────────────────────────────────────────
export function PlayHubLogo() {
  const homeUrl = process.env.NEXT_PUBLIC_HOME_URL ?? "https://playhub-home.vercel.app";
  return (
    <a href={homeUrl} style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
      <span style={{ fontSize: 14, color: "#AAA", fontWeight: 500, marginRight: 6 }}>←</span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 2.5, marginRight: 5 }}>
        <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#CC785C" }} />
        <span style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: "#CC785C", opacity: 0.55 }} />
        <span style={{ display: "inline-block", width: 3, height: 3, borderRadius: "50%", background: "#CC785C", opacity: 0.25 }} />
      </span>
      <span style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A", letterSpacing: -0.3 }}>play</span>
      <span style={{ fontSize: 15, fontWeight: 700, color: "#CC785C", letterSpacing: -0.3 }}>hub</span>
      <span style={{ fontSize: 14, color: "#CCC", margin: "0 7px", fontWeight: 400 }}>|</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: "#555", letterSpacing: -0.2 }}>Dumb Charades</span>
    </a>
  );
}

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger" | "success";
  fullWidth?: boolean;
  children: ReactNode;
  color?: string;
}

export function Btn({ children, variant = "primary", fullWidth, style, disabled, color, ...props }: BtnProps) {
  const base: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    gap: 8, padding: "13px 24px", borderRadius: 8, fontSize: 15,
    fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
    border: "none", fontFamily: "inherit", letterSpacing: -0.2,
    width: fullWidth ? "100%" : undefined, opacity: disabled ? 0.45 : 1, ...style,
  };
  const bg = color ?? tokens.coral;
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
      "--brand": "#CC785C",
      minHeight: "100dvh", background: tokens.bg,
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
      paddingBottom: 32, ...style,
    } as React.CSSProperties}>{children}</div>
  );
}

export function TopBar({ title, sub, right }: { title?: string; sub?: string; right?: ReactNode; accent?: string }) {
  return (
    <>
      <div style={{
        padding: "14px 20px",
        borderBottom: "0.5px solid rgba(0,0,0,0.08)",
        background: "#FAFAF8",
        position: "sticky", top: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <PlayHubLogo />
        {right}
      </div>
      {(title || sub) && (
        <div style={{ padding: "14px 20px 12px", background: "#FAFAF8", borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
          {title && <div style={{ fontSize: 18, fontWeight: 800, color: tokens.black, letterSpacing: -0.5 }}>{title}</div>}
          {sub && <div style={{ fontSize: 13, color: tokens.grey2, marginTop: 2 }}>{sub}</div>}
        </div>
      )}
    </>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 12 }}>
      {children}
    </div>
  );
}

// ─── Nav Action Button ────────────────────────────────────────────────────────
export function NavBtn({ children, onClick, danger }: { children: ReactNode; onClick?: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "7px 14px", borderRadius: 10,
        border: `1.5px solid ${danger ? "#FECACA" : "#F0F0F0"}`,
        background: danger ? "#FEF2F2" : "#fff",
        cursor: "pointer", fontSize: 13, fontWeight: 600,
        color: danger ? "#DC2626" : "#555",
        fontFamily: "inherit", transition: "opacity 0.15s",
        whiteSpace: "nowrap" as const,
      }}
    >{children}</button>
  );
}

// ─── Options Menu ─────────────────────────────────────────────────────────────
export function OptionsMenu({ onNewGame, onExit }: { onNewGame?: () => void; onExit: () => void }) {
  const [open, setOpen] = useState(false);
  const border = `1.5px solid ${tokens.border}`;
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Options"
        style={{
          padding: "6px 12px", borderRadius: 8, border,
          background: tokens.white, cursor: "pointer",
          fontSize: 16, fontWeight: 700, color: tokens.grey1,
          fontFamily: "inherit", lineHeight: 1,
        }}
      >⋮</button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 100 }} />
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", right: 0,
            background: tokens.white, borderRadius: 12, border,
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
              >New Game</button>
            )}
            <button
              onClick={() => { setOpen(false); onExit(); }}
              style={{
                display: "block", width: "100%", padding: "12px 16px",
                background: "none", border: "none", cursor: "pointer",
                fontSize: 14, fontWeight: 600, color: tokens.red,
                textAlign: "left", fontFamily: "inherit",
              }}
            >Exit Game</button>
          </div>
        </>
      )}
    </div>
  );
}
