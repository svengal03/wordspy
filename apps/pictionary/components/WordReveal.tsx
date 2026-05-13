"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Btn, Card, Screen, TopBar, tokens } from "./ui";

interface Props {
  drawerName: string;
  teamName: string;
  teamColor: string;
  word: string;
  onReady: () => void;
}

export function WordReveal({ drawerName, teamName, teamColor, word, onReady }: Props) {
  const [revealed, setRevealed] = useState(false);

  return (
    <Screen style={{ display: "flex", flexDirection: "column" }}>
      <TopBar title="Pictionary" accent={teamColor} />

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          <AnimatePresence mode="wait">
            {!revealed ? (
              <motion.div
                key="hidden"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card style={{ textAlign: "center", padding: "48px 32px", borderStyle: "dashed" }}>
                  <div style={{ fontSize: 12, color: tokens.grey3, marginBottom: 8 }}>Pass phone to</div>
                  <div style={{
                    background: "#F5F5F0", border: `1.5px solid ${tokens.border}`,
                    borderRadius: 14, padding: "18px 24px", marginBottom: 8,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: tokens.black, letterSpacing: -0.5 }}>
                      {drawerName}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: tokens.grey3, marginBottom: 8 }}>{teamName}</div>
                  <div style={{ fontSize: 12, color: tokens.grey3, marginBottom: 24 }}>Everyone else look away</div>
                  <Btn fullWidth color={teamColor} onClick={() => setRevealed(true)} style={{ padding: "14px" }}>
                    Tap to see word
                  </Btn>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="revealed"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card style={{ textAlign: "center", padding: "40px 32px" }}>
                  <div style={{ fontSize: 12, color: tokens.grey3, marginBottom: 12 }}>Your word is</div>
                  <div style={{
                    background: "#F5F5F0", border: `1.5px solid ${tokens.border}`,
                    borderRadius: 14, padding: "20px 24px", marginBottom: 14,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <div style={{ fontSize: 32, fontWeight: 800, color: tokens.black, letterSpacing: -0.5, lineHeight: 1.2 }}>
                      {word}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: tokens.grey3, marginBottom: 24 }}>
                    Draw only. No letters, numbers, or speaking.
                  </div>
                  <Btn fullWidth color={teamColor} onClick={onReady} style={{ padding: "14px" }}>
                    Start Drawing →
                  </Btn>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Screen>
  );
}
