"use client";
import { motion } from "framer-motion";

const ACCENT = "#CC785C";
const BORDER = "#F0F0F0";
const GREEN = "#16A34A";

// ─── RevealCover ──────────────────────────────────────────────────────────────
// The dashed "pass the phone" card shown before the role/word is revealed.
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
  accentColor = ACCENT,
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
        onClick={onReveal}
        style={{
          background: "#FFFFFF",
          border: `2px dashed ${BORDER}`,
          borderRadius: 24,
          padding: "56px 40px",
          textAlign: "center",
          boxShadow: "0 2px 20px rgba(0,0,0,0.06)",
          cursor: "pointer",
        }}
      >
        <div style={{ fontSize: 12, color: "#AAA", marginBottom: 12, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase" }}>
          {label}
        </div>
        <div style={{
          background: "#F5F5F0",
          border: `1.5px solid ${BORDER}`,
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
          onClick={(e) => { e.stopPropagation(); onReveal(); }}
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
interface PhaseTrailProps {
  phases: string[];
  current: string;
  accentColor?: string;
}

export function PhaseTrail({ phases, current, accentColor = ACCENT }: PhaseTrailProps) {
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

// ─── RevealProgressDots ───────────────────────────────────────────────────────
interface RevealProgressDotsProps {
  total: number;
  current: number; // 0-indexed
  accentColor?: string;
  doneColor?: string;
}

export function RevealProgressDots({
  total,
  current,
  accentColor = ACCENT,
  doneColor = GREEN,
}: RevealProgressDotsProps) {
  return (
    <div style={{ display: "flex", gap: 5 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: 20, height: 5, borderRadius: 3,
          background: i < current ? doneColor : i === current ? accentColor : BORDER,
          transition: "background .3s",
        }} />
      ))}
    </div>
  );
}

export { CategoryPicker } from "./CategoryPicker";

// ─── PlayHubLogo ──────────────────────────────────────────────────────────────
export function PlayHubLogo() {
  const homeUrl = process.env.NEXT_PUBLIC_HOME_URL ?? "https://playhub-home.vercel.app";
  return (
    <a href={homeUrl} style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 2.5, marginRight: 5 }}>
        <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#CC785C" }} />
        <span style={{ display: "inline-block", width: 5.5, height: 5.5, borderRadius: "50%", background: "#CC785C", opacity: 0.55 }} />
        <span style={{ display: "inline-block", width: 3, height: 3, borderRadius: "50%", background: "#CC785C", opacity: 0.25 }} />
      </span>
      <span style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", letterSpacing: -0.3 }}>play</span>
      <span style={{ fontSize: 16, fontWeight: 700, color: "#CC785C", letterSpacing: -0.3 }}>hub</span>
    </a>
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
