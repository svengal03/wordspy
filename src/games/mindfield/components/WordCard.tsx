"use client";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import type { Tile, PlayerRole, TeamColor } from "../types";

interface Props {
  tile: Tile;
  viewerRole: PlayerRole | null;
  viewerTeam: TeamColor | null;
  activeTeam: TeamColor;
  canTap: boolean;
  onTap: (id: number) => void;
  flagged?: boolean;
  canFlag?: boolean;
  onFlag?: (id: number) => void;
}

const REVEALED: Record<string, { bg: string; text: string; border: string }> = {
  red:     { bg: "#B22234", text: "#FFFFFF", border: "#8B1A28" },
  blue:    { bg: "#1A3F7A", text: "#FFFFFF", border: "#112C5C" },
  neutral: { bg: "#9E7B4E", text: "#FFFFFF", border: "#7A5E38" },
  bomb:    { bg: "#141414", text: "#FFFFFF", border: "#000000" },
};

const SPY_UNREVEALED: Record<string, { bg: string; text: string; border: string }> = {
  red:     { bg: "#E8929D", text: "#5C0A14", border: "#CC6070" },
  blue:    { bg: "#8BAAD4", text: "#0A1F42", border: "#5A7BB0" },
  neutral: { bg: "#D4B88A", text: "#4A3520", border: "#B89A66" },
  bomb:    { bg: "#555555", text: "#FFFFFF", border: "#333333" },
};

const AGENT_UNREVEALED = { bg: "#F0E6C8", text: "#2A1A0E", border: "#C8B48A" };

export default function WordCard({ tile, viewerRole, canTap, onTap, flagged, canFlag, onFlag }: Props) {
  const isSpymaster = viewerRole === "spymaster";
  const isClickable = canTap && !tile.revealed;

  const unrevealedStyle = isSpymaster ? SPY_UNREVEALED[tile.color] : AGENT_UNREVEALED;
  const revealedStyle = REVEALED[tile.color];

  // Track flip animation: displayRevealed lags behind tile.revealed so we can
  // show unrevealed colors during the first half of the flip, then snap.
  const [flipping, setFlipping] = useState(false);
  const [displayRevealed, setDisplayRevealed] = useState(tile.revealed);
  const prevRevealedRef = useRef(tile.revealed);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (tile.revealed && !prevRevealedRef.current) {
      timers.current.forEach(clearTimeout);
      setFlipping(true);
      setDisplayRevealed(false);
      timers.current = [
        setTimeout(() => setDisplayRevealed(true), 180),
        setTimeout(() => setFlipping(false), 400),
      ];
    } else if (!tile.revealed) {
      setDisplayRevealed(false);
    }
    prevRevealedRef.current = tile.revealed;
    return () => timers.current.forEach(clearTimeout);
  }, [tile.revealed]);

  const style = displayRevealed ? revealedStyle : unrevealedStyle;
  const opacity = displayRevealed && !isSpymaster && tile.color !== "bomb" ? 0.5 : 1;
  const showFlag = !tile.revealed && (flagged || canFlag);

  return (
    <motion.button
      whileTap={isClickable ? { scale: 0.92, y: 1 } : {}}
      whileHover={isClickable ? { scale: 1.03, y: -1 } : {}}
      onClick={() => isClickable && onTap(tile.id)}
      animate={flipping ? { scaleX: [1, 0.04, 0.04, 1] } : { scaleX: 1 }}
      transition={flipping ? { duration: 0.38, times: [0, 0.45, 0.55, 1], ease: "easeInOut" } : { duration: 0.15 }}
      style={{
        position: "relative",
        background: style.bg,
        color: style.text,
        border: `1.5px solid ${flagged ? "#F59E0B" : style.border}`,
        borderRadius: 7,
        padding: "6px 5px",
        fontSize: tile.word.length > 9 ? 9 : tile.word.length > 7 ? 10 : 11,
        fontWeight: 800,
        textAlign: "center",
        cursor: isClickable ? "pointer" : "default",
        opacity,
        letterSpacing: 0.6,
        lineHeight: 1.2,
        wordBreak: "break-word",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        textTransform: "uppercase",
        minHeight: 58,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
        WebkitUserSelect: "none",
        overflow: "hidden",
        boxShadow: tile.revealed
          ? "inset 0 2px 4px rgba(0,0,0,0.2)"
          : flagged
            ? "0 0 0 2px #F59E0B60, 0 2px 5px rgba(0,0,0,0.14)"
            : "0 2px 5px rgba(0,0,0,0.14), 0 1px 2px rgba(0,0,0,0.08)",
        transition: "background 0.05s, color 0.05s, border-color 0.12s, box-shadow 0.15s, opacity 0.2s",
      }}
    >
      {displayRevealed && tile.color === "bomb"
        ? <span style={{ fontSize: 22, lineHeight: 1 }}>💣</span>
        : tile.word
      }

      {/* Flag button — visible to agents during guessing */}
      {showFlag && (
        <span
          role="button"
          aria-label={flagged ? "Remove flag" : "Flag card"}
          onClick={(e) => {
            e.stopPropagation();
            if (canFlag) onFlag?.(tile.id);
          }}
          style={{
            position: "absolute",
            top: 2,
            right: 3,
            fontSize: flagged ? 13 : 12,
            lineHeight: 1,
            opacity: flagged ? 1 : 0.75,
            cursor: canFlag ? "pointer" : "default",
            userSelect: "none",
            WebkitUserSelect: "none",
            padding: "4px 5px",
            borderRadius: 4,
            background: flagged ? "rgba(245,158,11,0.15)" : "transparent",
          }}
        >
          🚩
        </span>
      )}
    </motion.button>
  );
}
