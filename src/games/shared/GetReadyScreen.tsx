"use client";
import { type ReactNode, useState } from "react";
import { motion } from "framer-motion";
import { Btn, Screen, TopBar, NavBtn, OptionsMenu, tokens, useGoHome } from "@playhub/ui";

interface Props {
  appName: string;
  accentColor?: string;
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  hints?: { icon?: string; text: string }[];
  buttonLabel?: string;
  rulesModal?: (props: { isOpen: boolean; onClose: () => void }) => ReactNode;
  onStart?: () => void;
  onNewGame?: () => void;
  onLeave?: () => void;
  waitingMessage?: string;
}

export function GetReadyScreen({
  appName,
  accentColor = tokens.coral,
  eyebrow = "Get Ready",
  title,
  subtitle,
  hints,
  buttonLabel = "I'm Ready →",
  rulesModal,
  onStart,
  onNewGame,
  onLeave,
  waitingMessage,
}: Props) {
  const goHome = useGoHome();
  const [showRules, setShowRules] = useState(false);
  const [starting, setStarting] = useState(false);

  async function handleStart() {
    if (starting || !onStart) return;
    setStarting(true);
    try {
      await onStart();
    } finally {
      setStarting(false);
    }
  }

  return (
    <Screen style={{ display: "flex", flexDirection: "column" }}>
      <TopBar
        appName={appName}
        right={
          <div style={{ display: "flex", gap: 8 }}>
            {rulesModal && <NavBtn onClick={() => setShowRules(true)}>Rules</NavBtn>}
            <OptionsMenu onNewGame={onNewGame} onExit={onLeave ?? goHome} />
          </div>
        }
      />
      {rulesModal?.({ isOpen: showRules, onClose: () => setShowRules(false) })}

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 560, textAlign: "center" }}>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: accentColor,
              marginBottom: 14,
            }}
          >
            {eyebrow}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            style={{
              fontSize: 34,
              fontWeight: 800,
              letterSpacing: -0.8,
              color: tokens.black,
              lineHeight: 1.15,
              marginBottom: subtitle ? 14 : 26,
            }}
          >
            {title}
          </motion.div>

          {subtitle && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.12 }}
              style={{ fontSize: 15, color: tokens.grey1, lineHeight: 1.5, marginBottom: 28 }}
            >
              {subtitle}
            </motion.div>
          )}

          {hints && hints.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginBottom: 28,
                textAlign: "left",
              }}
            >
              {hints.map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.25 + i * 0.06 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    borderRadius: tokens.radius.md,
                    background: tokens.white,
                    border: `1px solid ${tokens.border}`,
                  }}
                >
                  {h.icon && <span style={{ fontSize: 20, flexShrink: 0 }}>{h.icon}</span>}
                  <span style={{ fontSize: 14, color: tokens.grey1, lineHeight: 1.4 }}>{h.text}</span>
                </motion.div>
              ))}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            {waitingMessage ? (
              <div
                style={{
                  padding: "16px",
                  borderRadius: tokens.radius.md,
                  background: tokens.white,
                  border: `1.5px dashed ${tokens.border}`,
                  fontSize: 14,
                  color: tokens.grey2,
                  textAlign: "center",
                }}
              >
                {waitingMessage}
              </div>
            ) : (
              <Btn
                fullWidth
                color={accentColor}
                onClick={handleStart}
                disabled={starting || !onStart}
                style={{ padding: "16px", fontSize: 16 }}
              >
                {buttonLabel}
              </Btn>
            )}
          </motion.div>
        </div>
      </div>
    </Screen>
  );
}
