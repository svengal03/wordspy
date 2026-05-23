"use client";
import { ReactNode, ButtonHTMLAttributes, useState, useCallback, useEffect, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";

export { tokens } from "./tokens";
export { Modal } from "./Modal";
export { CategoryPicker } from "./CategoryPicker";
export { RulesModal } from "./RulesModal";
export { useGoHome } from "./hooks/useGoHome";
export { fadeUp, fadeIn, fadeUpReduced, stagger } from "./animations";

import { tokens } from "./tokens";

// ─── PlayHubLogo ──────────────────────────────────────────────────────────────
export function PlayHubLogo({ appName, href = "/" }: { appName?: string; href?: string }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center" }}>
      <a href={href} style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
        <span style={{ fontSize: 14, color: "#AAA", fontWeight: 500, marginRight: 6 }}>←</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 2.5, marginRight: 5 }}>
          <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: tokens.coral }} />
          <span style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: tokens.coral, opacity: 0.55 }} />
          <span style={{ display: "inline-block", width: 3, height: 3, borderRadius: "50%", background: tokens.coral, opacity: 0.25 }} />
        </span>
        <span style={{ fontSize: 15, fontWeight: 700, color: tokens.black, letterSpacing: -0.3 }}>play</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: tokens.coral, letterSpacing: -0.3 }}>hub</span>
      </a>
      {appName && (
        <>
          <span style={{ fontSize: 14, color: tokens.grey4, margin: "0 7px", fontWeight: 400 }}>|</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: tokens.grey1, letterSpacing: -0.2 }}>{appName}</span>
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
        width: "100%", padding: "11px 13px", borderRadius: tokens.radius.md,
        border: `1.5px solid ${tokens.border}`, fontSize: 14,
        fontFamily: "inherit", background: tokens.inputBg,
        color: tokens.black, boxSizing: "border-box" as const, ...style,
      }}
    />
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
export function Input({
  label,
  error,
  style,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) {
  const id = useId();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <label htmlFor={id} style={{ fontSize: 12, fontWeight: 700, color: tokens.grey3, letterSpacing: 1, textTransform: "uppercase" }}>
          {label}
        </label>
      )}
      <input
        id={id}
        style={{
          width: "100%", padding: "11px 13px", borderRadius: tokens.radius.md,
          border: `1.5px solid ${error ? tokens.red : tokens.border}`, fontSize: 14,
          fontFamily: "inherit", background: tokens.inputBg,
          color: tokens.black, boxSizing: "border-box" as const,
          transition: "border-color 0.15s", ...style,
        }}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {error && (
        <span id={`${id}-error`} role="alert" style={{ fontSize: 12, color: tokens.red, fontWeight: 500 }}>
          {error}
        </span>
      )}
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
  variant?: "primary" | "ghost" | "danger" | "secondary" | "warning" | "success";
  fullWidth?: boolean;
  children: ReactNode;
  color?: string;
}

export function Btn({ children, variant = "primary", fullWidth, style, disabled, color, ...props }: BtnProps) {
  const base: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    gap: 8, padding: "13px 24px", borderRadius: tokens.radius.md, fontSize: 15,
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
      background: tokens.card, borderRadius: tokens.radius.xl, padding: tokens.space[5],
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
export function Avatar({ name, size = 40, active, eliminated, color }: { name: string; size?: number; active?: boolean; eliminated?: boolean; color?: string }) {
  const bg = active ? tokens.coral : eliminated ? "#F5F5F5" : color ? color + "20" : tokens.avatarBg;
  const fg = active ? "#fff" : eliminated ? tokens.grey4 : color ?? tokens.grey2;
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28,
      background: bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.32, fontWeight: 700, color: fg,
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
      "--brand": tokens.coral,
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
        borderBottom: `0.5px solid ${tokens.divider}`,
        background: tokens.bg,
        position: "sticky", top: 0, zIndex: tokens.zIndex.topbar,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <PlayHubLogo appName={appName} />
        {right}
      </div>
      {(title || sub) && (
        <div style={{ padding: "14px 20px 12px", background: tokens.bg, borderBottom: `0.5px solid ${tokens.divider}` }}>
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
      borderRadius: tokens.radius.lg, padding: "14px 16px",
    }}>
      <div style={{ fontSize: 13, color, fontWeight: 600, marginBottom: 4 }}>{icon} {title}</div>
      <div style={{ fontSize: 13, color: tokens.grey2, lineHeight: 1.5 }}>{body}</div>
    </div>
  );
}

// ─── ConfirmDialog ────────────────────────────────────────────────────────────
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  dangerous,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  dangerous?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.45)", zIndex: tokens.zIndex.modal,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
          }}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: tokens.white, borderRadius: tokens.radius.xl,
              border: `1.5px solid ${tokens.border}`,
              boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
              padding: "24px 20px", width: "100%",
              maxWidth: "min(360px, calc(100vw - 40px))",
              fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
            }}
          >
            <div id={titleId} style={{ fontSize: 16, fontWeight: 800, color: tokens.black, marginBottom: body ? 8 : 20 }}>
              {title}
            </div>
            {body && (
              <div style={{ fontSize: 14, color: tokens.grey2, lineHeight: 1.55, marginBottom: 20 }}>{body}</div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={onCancel}
                style={{
                  flex: 1, padding: "11px 16px", borderRadius: tokens.radius.md,
                  border: `1.5px solid ${tokens.border}`, background: tokens.white,
                  fontSize: 14, fontWeight: 600, color: tokens.grey1, cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >{cancelLabel}</button>
              <button
                onClick={onConfirm}
                style={{
                  flex: 1, padding: "11px 16px", borderRadius: tokens.radius.md,
                  border: "none",
                  background: dangerous ? tokens.red : tokens.coral,
                  fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >{confirmLabel}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── OptionsMenu ─────────────────────────────────────────────────────────────
export function OptionsMenu({ onExit, onNewGame }: { onExit: () => void; onNewGame?: () => void }) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  return (
    <>
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setOpen(!open)}
          aria-label="Options"
          aria-expanded={open}
          aria-haspopup="true"
          style={{
            padding: "6px 12px", borderRadius: tokens.radius.md,
            border: `1.5px solid ${tokens.border}`,
            background: tokens.white, cursor: "pointer",
            fontSize: 16, fontWeight: 700, color: tokens.grey1,
            fontFamily: "inherit", lineHeight: 1,
          }}
        >⋮</button>
        {open && (
          <>
            <div
              onClick={() => setOpen(false)}
              style={{ position: "fixed", inset: 0, zIndex: tokens.zIndex.dropdown }}
            />
            <div style={{
              position: "absolute", top: "calc(100% + 6px)", right: 0,
              background: tokens.white, borderRadius: tokens.radius.lg,
              border: `1.5px solid ${tokens.border}`,
              boxShadow: "0 4px 20px rgba(0,0,0,.12)",
              zIndex: tokens.zIndex.dropdown + 1, minWidth: 150, overflow: "hidden",
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
                onClick={() => { setOpen(false); setConfirming(true); }}
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
      <ConfirmDialog
        open={confirming}
        title="Exit game?"
        body="Your progress will be lost."
        confirmLabel="Exit"
        cancelLabel="Keep playing"
        dangerous
        onConfirm={() => { setConfirming(false); onExit(); }}
        onCancel={() => setConfirming(false)}
      />
    </>
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
        padding: "7px 14px", borderRadius: tokens.radius.md,
        border: `1.5px solid ${danger ? "#FECACA" : tokens.border}`,
        background: danger ? tokens.redBg : tokens.white,
        cursor: "pointer", fontSize: 13, fontWeight: 600,
        color: danger ? tokens.red : tokens.grey1,
        fontFamily: "inherit", transition: "opacity 0.15s",
        whiteSpace: "nowrap" as const,
      }}
    >{children}</button>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 24, color = tokens.coral }: { size?: number; color?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      style={{
        width: size, height: size, borderRadius: "50%",
        border: `2px solid ${color}25`,
        borderTopColor: color,
        animation: "playhub-spin 0.7s linear infinite",
        flexShrink: 0,
      }}
    >
      <style>{`@keyframes playhub-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── LoadingScreen ────────────────────────────────────────────────────────────
export function LoadingScreen({ label = "Loading…" }: { label?: string }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: "100dvh", gap: 14,
      background: tokens.bg,
    }}>
      <Spinner size={32} />
      <span style={{ fontSize: 14, color: tokens.grey2 }}>{label}</span>
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: string;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: "100dvh", gap: 12,
      padding: "32px 24px", textAlign: "center", background: tokens.bg,
    }}>
      {icon && <span style={{ fontSize: 36 }} aria-hidden="true">{icon}</span>}
      <div style={{ fontSize: 16, fontWeight: 700, color: tokens.black }}>{title}</div>
      {body && <div style={{ fontSize: 14, color: tokens.grey2, lineHeight: 1.55, maxWidth: 300 }}>{body}</div>}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
type ToastType = "info" | "success" | "error" | "warning";
interface ToastItem { id: number; message: string; type: ToastType }

const TOAST_COLORS: Record<ToastType, { bg: string; border: string; text: string; icon: string }> = {
  info:    { bg: tokens.blueBg,   border: "#BFDBFE", text: tokens.blue,   icon: "ℹ" },
  success: { bg: tokens.greenBg,  border: "#BBF7D0", text: tokens.green,  icon: "✓" },
  error:   { bg: tokens.redBg,    border: "#FECACA", text: tokens.red,    icon: "✕" },
  warning: { bg: tokens.yellowBg, border: "#FDE047", text: tokens.yellow, icon: "!" },
};

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);
  return { toasts, toast };
}

export function ToastContainer({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div style={{
      position: "fixed", bottom: "max(20px, env(safe-area-inset-bottom))",
      left: "50%", transform: "translateX(-50%)",
      display: "flex", flexDirection: "column", gap: 8,
      zIndex: tokens.zIndex.modal + 10, pointerEvents: "none",
      width: "calc(100% - 40px)", maxWidth: 380,
    }}>
      <AnimatePresence>
        {toasts.map((t) => {
          const c = TOAST_COLORS[t.type];
          return (
            <motion.div
              key={t.id}
              role="alert"
              aria-live="assertive"
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              style={{
                background: c.bg, border: `1.5px solid ${c.border}`,
                borderRadius: tokens.radius.lg, padding: "12px 16px",
                display: "flex", alignItems: "center", gap: 10,
                boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
                pointerEvents: "auto",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, color: c.text, flexShrink: 0 }}>{c.icon}</span>
              <span style={{ fontSize: 13, color: c.text, fontWeight: 500 }}>{t.message}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
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
        <div style={{ fontSize: 12, color: tokens.grey3, marginBottom: 12, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase" }}>
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
          <div style={{ fontSize: 36, fontWeight: 800, color: tokens.black, letterSpacing: -0.8 }}>
            {playerName}
          </div>
        </div>
        {subtitle && (
          <div style={{ fontSize: 13, color: tokens.grey3, marginBottom: 16, fontWeight: 600 }}>
            {subtitle}
          </div>
        )}
        <div style={{ fontSize: 13, color: tokens.grey3, marginBottom: 28 }}>
          {lookAwayText}
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onReveal}
          style={{
            width: "100%",
            padding: "16px 24px",
            borderRadius: tokens.radius.lg,
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
            color: phase === current ? accentColor : tokens.grey4,
            letterSpacing: 0.5,
          }}>
            {phase}
          </span>
          {i < phases.length - 1 && (
            <span style={{ fontSize: 10, color: tokens.grey4 }}>›</span>
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
  howItWorks,
  onSubmit,
  onExit,
  rulesModal,
}: {
  appName: string;
  tagline: ReactNode;
  description: string;
  howItWorks?: { icon: string; title: string; desc: string }[];
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
      <div style={{ flex: 1, maxWidth: 480, margin: "0 auto", width: "100%", padding: "0 24px 40px", boxSizing: "border-box" }}>
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.4, ease: "easeOut" }} style={{ paddingTop: 32, marginBottom: 24 }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: tokens.black, letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 10 }}>
            {tagline}
          </div>
          <div style={{ fontSize: 15, color: tokens.grey2, lineHeight: 1.6, marginBottom: 32, maxWidth: 300 }}>{description}</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4, ease: "easeOut" }}>
          <Card style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: tokens.grey3, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
              Your Name (Host)
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
          <Btn fullWidth onClick={submit} disabled={!name.trim()} style={{ padding: "15px 24px", fontSize: 16, marginBottom: 32 }}>
            Set Up Game →
          </Btn>
        </motion.div>

        {howItWorks && howItWorks.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: tokens.grey3, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14 }}>
              How it works
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {howItWorks.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, background: "#F5F0ED",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0,
                  }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: tokens.black }}>{s.title}</div>
                    <div style={{ fontSize: 13, color: tokens.grey2, marginTop: 2, lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
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
    <div
      style={{ display: "flex", gap: 5 }}
      role="progressbar"
      aria-valuenow={current}
      aria-valuemax={total}
      aria-label={`Step ${current + 1} of ${total}`}
    >
      {Array.from({ length: total }).map((_, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div
            key={i}
            title={done ? "Done" : active ? "Current" : "Pending"}
            style={{
              width: 20, height: 5, borderRadius: 3,
              background: done ? doneColor : active ? accentColor : tokens.border,
              transition: "background .3s",
              outline: !done && !active ? `1px solid ${tokens.grey4}` : "none",
              outlineOffset: "-1px",
            }}
          />
        );
      })}
    </div>
  );
}
