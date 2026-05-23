"use client";
import { ReactNode, ButtonHTMLAttributes, useState } from "react";
import { motion } from "framer-motion";

export { tokens } from "./tokens";
export { Modal } from "./Modal";
export { CategoryPicker } from "./CategoryPicker";
export { RulesModal } from "./RulesModal";
export { useGoHome } from "./hooks/useGoHome";
export { fadeUp, fadeIn, stagger } from "./animations";

import { tokens } from "./tokens";

// ─── PlayHubLogo ──────────────────────────────────────────────────────────────
export function PlayHubLogo({ appName, href = "/" }: { appName?: string; href?: string }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center" }}>
      <a href={href} style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
        <span style={{ fontSize: 14, color: "#AAA", fontWeight: 500, marginRight: 6 }}>←</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 2.5, marginRight: 5 }}>
          <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#CC785C" }} />
          <span style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: "#CC785C", opacity: 0.55 }} />
          <span style={{ display: "inline-block", width: 3, height: 3, borderRadius: "50%", background: "#CC785C", opacity: 0.25 }} />
        </span>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A", letterSpacing: -0.3 }}>play</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#CC785C", letterSpacing: -0.3 }}>hub</span>
      </a>
      {appName && (
        <>
          <span style={{ fontSize: 14, color: "#CCC", margin: "0 7px", fontWeight: 400 }}>|</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#555", letterSpacing: -0.2 }}>{appName}</span>
        </>
      )}
    </div>
  );
}

// ─── PlayerNameInput ──────────────────────────────────────────────────────────
export function PlayerNameInput({
  value,
  onChange,
  onKeyDown,
  placeholder = "Player name…",
  maxLength = 20,
  autoFocus,
  style,
}: {
  value: string;
  onChange: (val: string) => void;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  placeholder?: string;
  maxLength?: number;
  autoFocus?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      maxLength={maxLength}
      autoFocus={autoFocus}
      style={{
        width: "100%", padding: "11px 13px", borderRadius: 10,
        border: "1.5px solid #F0F0F0", fontSize: 14,
        fontFamily: "inherit", background: "#FAFAFA", outline: "none",
        color: "#1A1A1A", boxSizing: "border-box" as const, ...style,
      }}
    />
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
  variant?: "primary" | "ghost" | "danger" | "secondary" | "warning" | "success";
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
    transition: "opacity .15s, transform .1s",
    width: fullWidth ? "100%" : undefined,
    opacity: disabled ? 0.45 : 1, ...style,
  };
  const bg = color ?? tokens.coral;
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: bg, color: "#fff", boxShadow: `0 4px 14px ${bg}40` },
    ghost: { background: "transparent", color: tokens.grey2, border: `1.5px solid ${tokens.border}` },
    danger: { background: tokens.redBg, color: tokens.red, border: `1.5px solid #FECACA` },
    secondary: { background: "#F5F5F5", color: tokens.black },
    warning: { background: tokens.yellowBg, color: tokens.yellow, border: `1.5px solid #FDE047` },
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
    <div
      role="switch"
      aria-checked={value}
      tabIndex={0}
      onClick={() => onChange(!value)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onChange(!value); } }}
      style={{
        width: 44, height: 26, borderRadius: 13, cursor: "pointer",
        background: value ? tokens.coral : "#E5E5E5", position: "relative",
        transition: "background .2s", flexShrink: 0,
      }}
    >
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
      fontSize: size * 0.32, fontWeight: 700,
      color: active ? "#fff" : eliminated ? tokens.grey4 : tokens.grey2,
      flexShrink: 0, opacity: eliminated ? 0.5 : 1,
      border: active ? `2px solid ${tokens.coralLight}` : "2px solid transparent",
    }}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
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

// ─── TopBar ───────────────────────────────────────────────────────────────────
export function TopBar({ title, sub, right, appName }: { title?: string; sub?: string; right?: ReactNode; appName?: string }) {
  return (
    <>
      <div style={{
        padding: "14px 20px",
        borderBottom: "0.5px solid rgba(0,0,0,0.08)",
        background: "#FAFAF8",
        position: "sticky", top: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <PlayHubLogo appName={appName} />
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

// ─── InfoBox ──────────────────────────────────────────────────────────────────
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

// ─── OptionsMenu ─────────────────────────────────────────────────────────────
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
      >⋮</button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 100 }} />
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

// ─── Divider ──────────────────────────────────────────────────────────────────
export function Divider() {
  return <div style={{ height: 1, background: tokens.border, margin: "4px 0" }} />;
}

// ─── NavBtn ───────────────────────────────────────────────────────────────────
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

// ─── RevealCover ──────────────────────────────────────────────────────────────
interface RevealCoverProps {
  playerName: string;
  label?: string;
  subtitle?: string;
  lookAwayText?: string;
  buttonLabel?: string;
  accentColor?: string;
  onReveal: () => void;
}

export function RevealCover({
  playerName,
  label = "Pass phone to",
  subtitle,
  lookAwayText = "Everyone else look away",
  buttonLabel = "Tap to reveal →",
  accentColor = tokens.coral,
  onReveal,
}: RevealCoverProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{ width: "100%", maxWidth: 440 }}
    >
      <div
        style={{
          background: "#FFFFFF",
          border: `2px dashed ${tokens.border}`,
          borderRadius: 24,
          padding: "56px 40px",
          textAlign: "center",
          boxShadow: "0 2px 20px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ fontSize: 12, color: "#AAA", marginBottom: 12, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase" }}>
          {label}
        </div>
        <div style={{
          background: "#F5F5F0",
          border: `1.5px solid ${tokens.border}`,
          borderRadius: 16,
          padding: "22px 32px",
          marginBottom: subtitle ? 8 : 20,
          minHeight: 88,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: "#1A1A1A", letterSpacing: -0.8 }}>
            {playerName}
          </div>
        </div>
        {subtitle && (
          <div style={{ fontSize: 13, color: "#AAA", marginBottom: 16, fontWeight: 600 }}>
            {subtitle}
          </div>
        )}
        <div style={{ fontSize: 13, color: "#AAA", marginBottom: 28 }}>
          {lookAwayText}
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onReveal}
          style={{
            width: "100%",
            padding: "16px 24px",
            borderRadius: 14,
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
            border: "none",
            fontFamily: "inherit",
            letterSpacing: -0.2,
            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}DD)`,
            color: "#fff",
            boxShadow: `0 4px 16px ${accentColor}45`,
          }}
        >
          {buttonLabel}
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── PhaseTrail ───────────────────────────────────────────────────────────────
export function PhaseTrail({ phases, current, accentColor = tokens.coral }: { phases: string[]; current: string; accentColor?: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: 6, padding: "12px 20px 0", flexWrap: "wrap",
    }}>
      {phases.map((phase, i) => (
        <div key={phase} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: phase === current ? accentColor : "#CCC",
            letterSpacing: 0.5,
          }}>
            {phase}
          </span>
          {i < phases.length - 1 && (
            <span style={{ fontSize: 10, color: "#CCC" }}>›</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── GameLobbyScreen ─────────────────────────────────────────────────────────
export function GameLobbyScreen({
  appName,
  tagline,
  description,
  onSubmit,
  onExit,
  rulesModal,
}: {
  appName: string;
  tagline: ReactNode;
  description: string;
  onSubmit: (name: string) => void;
  onExit: () => void;
  rulesModal?: (props: { isOpen: boolean; onClose: () => void }) => ReactNode;
}) {
  const [name, setName] = useState("");
  const [showRules, setShowRules] = useState(false);

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  }

  return (
    <Screen>
      <TopBar
        appName={appName}
        right={
          <div style={{ display: "flex", gap: 8 }}>
            {rulesModal && <NavBtn onClick={() => setShowRules(true)}>Rules</NavBtn>}
            <NavBtn onClick={onExit}>Exit</NavBtn>
          </div>
        }
      />
      {rulesModal?.({ isOpen: showRules, onClose: () => setShowRules(false) })}
      <div style={{ padding: "20px", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ paddingTop: 8 }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: tokens.black, letterSpacing: -1.2, lineHeight: 1.1, marginBottom: 10 }}>
            {tagline}
          </div>
          <div style={{ fontSize: 14, color: tokens.grey2, lineHeight: 1.6 }}>{description}</div>
        </div>
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, color: tokens.grey3, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
            Your Name
          </div>
          <PlayerNameInput
            value={name}
            onChange={setName}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="e.g. Rahul, Priya…"
            autoFocus
            style={{ fontSize: 15, padding: "12px 14px" }}
          />
        </Card>
        <Btn fullWidth onClick={submit} disabled={!name.trim()} style={{ padding: "15px 24px", fontSize: 16 }}>
          Set Up Game →
        </Btn>
      </div>
    </Screen>
  );
}

// ─── RevealProgressDots ───────────────────────────────────────────────────────
export function RevealProgressDots({
  total,
  current,
  accentColor = tokens.coral,
  doneColor = tokens.green,
}: {
  total: number;
  current: number;
  accentColor?: string;
  doneColor?: string;
}) {
  return (
    <div style={{ display: "flex", gap: 5 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: 20, height: 5, borderRadius: 3,
          background: i < current ? doneColor : i === current ? accentColor : tokens.border,
          transition: "background .3s",
        }} />
      ))}
    </div>
  );
}
