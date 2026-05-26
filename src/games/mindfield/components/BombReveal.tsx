"use client";
import { motion } from "framer-motion";
import { tokens } from "@playhub/ui";
import type { TeamColor } from "../types";

interface Props {
  triggeredBy: TeamColor;
  word: string;
}

export default function BombReveal({ triggeredBy, word }: Props) {
  const loser = triggeredBy;
  const winner: TeamColor = triggeredBy === "red" ? "blue" : "red";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: "fixed",
        inset: 0,
        background: "#0A0A0A",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        zIndex: 200,
        padding: 32,
        textAlign: "center",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.3, 1] }}
        transition={{ duration: 0.5, times: [0, 0.6, 1] }}
        style={{ fontSize: 80 }}
      >
        💣
      </motion.div>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}
      >
        BOOM
      </motion.div>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        style={{ fontSize: 16, color: "#888", lineHeight: 1.6 }}
      >
        <span style={{ color: loser === "red" ? "#EF4444" : "#3B82F6", fontWeight: 700 }}>
          {loser === "red" ? "🔴 Red" : "🔵 Blue"}
        </span>{" "}
        hit the bomb on{" "}
        <span style={{ color: "#fff", fontWeight: 700 }}>&ldquo;{word}&rdquo;</span>
        <br />
        <span style={{ color: winner === "red" ? "#EF4444" : "#3B82F6", fontWeight: 700 }}>
          {winner === "red" ? "🔴 Red" : "🔵 Blue"}
        </span>{" "}
        wins the round
      </motion.div>
      <div style={{ marginTop: 8, fontSize: 13, color: "#555" }}>
        Waiting for host to start next round…
      </div>
    </motion.div>
  );
}
