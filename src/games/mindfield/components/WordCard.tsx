"use client";
import { motion } from "framer-motion";
import type { Tile, PlayerRole, TeamColor } from "../types";

interface Props {
  tile: Tile;
  viewerRole: PlayerRole | null;
  viewerTeam: TeamColor | null;
  activeTeam: TeamColor;
  canTap: boolean;
  onTap: (id: number) => void;
}

// Revealed (both roles see this after a card is tapped)
const REVEALED: Record<string, { bg: string; text: string; border: string }> = {
  red:     { bg: "#B22234", text: "#FFFFFF", border: "#8B1A28" },
  blue:    { bg: "#1A3F7A", text: "#FFFFFF", border: "#112C5C" },
  neutral: { bg: "#9E7B4E", text: "#FFFFFF", border: "#7A5E38" },
  bomb:    { bg: "#141414", text: "#FFFFFF", border: "#000000" },
};

// Spymaster key-card view — unrevealed tiles show muted full color so spy sees the whole map
const SPY_UNREVEALED: Record<string, { bg: string; text: string; border: string }> = {
  red:     { bg: "#E8929D", text: "#5C0A14", border: "#CC6070" },
  blue:    { bg: "#8BAAD4", text: "#0A1F42", border: "#5A7BB0" },
  neutral: { bg: "#D4B88A", text: "#4A3520", border: "#B89A66" },
  bomb:    { bg: "#555555", text: "#FFFFFF", border: "#333333" },
};

// Agent view — all unrevealed cards look identical (mystery)
const AGENT_UNREVEALED = { bg: "#F0E6C8", text: "#2A1A0E", border: "#C8B48A" };

export default function WordCard({ tile, viewerRole, canTap, onTap }: Props) {
  const isSpymaster = viewerRole === "spymaster";
  const isRevealed = tile.revealed;
  const isClickable = canTap && !isRevealed;

  const style = isRevealed
    ? REVEALED[tile.color]
    : isSpymaster
      ? SPY_UNREVEALED[tile.color]
      : AGENT_UNREVEALED;

  // Revealed cards fade out in agent view so the remaining unknown cards stand out
  const opacity = isRevealed && !isSpymaster && tile.color !== "bomb" ? 0.5 : 1;

  return (
    <motion.button
      whileTap={isClickable ? { scale: 0.92, y: 1 } : {}}
      whileHover={isClickable ? { scale: 1.03, y: -1 } : {}}
      onClick={() => isClickable && onTap(tile.id)}
      style={{
        position: "relative",
        background: style.bg,
        color: style.text,
        border: `1.5px solid ${style.border}`,
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
        boxShadow: isRevealed
          ? "inset 0 2px 4px rgba(0,0,0,0.2)"
          : "0 2px 5px rgba(0,0,0,0.14), 0 1px 2px rgba(0,0,0,0.08)",
        transition: "opacity 0.2s",
      }}
    >
      {isRevealed && tile.color === "bomb"
        ? <span style={{ fontSize: 22, lineHeight: 1 }}>💣</span>
        : tile.word
      }
    </motion.button>
  );
}
