"use client";
import { useState } from "react";

const CORAL = "#CC785C";

const games = [
  {
    name: "Wordspy",
    split: ["Word", "spy"],
    emoji: "🕵️",
    description: "Social deduction for 3–10 players. Find the spy before they fool everyone.",
    href: process.env.NEXT_PUBLIC_WORDSPY_URL,
    players: "3–10",
  },
  {
    name: "Mafia",
    split: ["Ma", "fia"],
    emoji: "🔪",
    description: "Social deduction for 5–15 players. Vote out the Mafia before they take over.",
    href: process.env.NEXT_PUBLIC_MAFIA_URL,
    players: "5–15",
  },
  {
    name: "DumbCharades",
    split: ["Dumb", " Charades"],
    emoji: "🎬",
    description: "Mime it, flail it, crack up everyone. No sounds allowed.",
    href: process.env.NEXT_PUBLIC_DUMBCHARADES_URL,
    players: "4+",
  },
  {
    name: "Pictionary",
    split: ["Pic", "tionary"],
    emoji: "🎨",
    description: "Draw a masterpiece, watch them guess 'stick figure'. Chaotic artistry.",
    href: process.env.NEXT_PUBLIC_PICITIONARY_URL,
    players: "4+",
  },
  {
    name: "Wavelength",
    split: ["Wave", "length"],
    emoji: "〰️",
    description: "Two teams. One spectrum. Give a clue, find the wavelength.",
    href: process.env.NEXT_PUBLIC_WAVELENGTH_URL,
    players: "4–12",
  },
];

export default function HomePage() {
  const [hoveredGame, setHoveredGame] = useState<string | null>(null);

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "#FAFAF8",
        fontFamily: "'DM Sans', sans-serif",
        padding: "32px 20px 32px",
        maxWidth: 520,
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      <header style={{ marginBottom: 32 }}>
        {/* PlayHub branded logo */}
        <div style={{ display: "inline-flex", alignItems: "center", marginBottom: 6 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 2.5, marginRight: 6 }}>
            <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: CORAL }} />
            <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: CORAL, opacity: 0.55 }} />
            <span style={{ display: "inline-block", width: 4, height: 4, borderRadius: "50%", background: CORAL, opacity: 0.25 }} />
          </span>
          <span style={{ fontSize: 28, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.02em", lineHeight: 1 }}>play</span>
          <span style={{ fontSize: 28, fontWeight: 800, color: CORAL, letterSpacing: "-0.02em", lineHeight: 1 }}>hub</span>
        </div>
        <p style={{ margin: "0", fontSize: 14, color: "#999", fontWeight: 400 }}>
          Party games for groups
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {games.map((game) => (
          <a
            key={game.name}
            href={game.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={game.name}
            onMouseEnter={() => setHoveredGame(game.name)}
            onMouseLeave={() => setHoveredGame(null)}
            style={{
              display: "flex",
              flexDirection: "column",
              background: "#fff",
              border: "1.5px solid #E8E5E1",
              borderRadius: 20,
              padding: "20px 16px",
              textDecoration: "none",
              transition: "box-shadow 0.15s ease",
              boxShadow: hoveredGame === game.name ? "0 4px 16px rgba(0,0,0,0.10)" : "none",
              boxSizing: "border-box",
            }}
          >
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: "#FFF8F5", border: `1.5px solid ${CORAL}20`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26, marginBottom: 14,
            }}>
              <span aria-hidden="true">{game.emoji}</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.02em", marginBottom: 4 }}>
              <span style={{ color: "#1A1A1A" }}>{game.split[0]}</span>
              <span style={{ color: CORAL }}>{game.split[1]}</span>
            </div>
            <p style={{ margin: "0 0 14px", fontSize: 13, color: "#777", lineHeight: 1.45, fontWeight: 400, flex: 1 }}>
              {game.description}
            </p>
            <span style={{
              fontSize: 11, fontWeight: 700, color: CORAL,
              background: "#FAECE7", border: `1px solid ${CORAL}40`,
              borderRadius: 6, padding: "3px 8px", letterSpacing: "0.04em",
              textTransform: "uppercase", alignSelf: "flex-start",
            }}>
              {game.players} players
            </span>
          </a>
        ))}
      </div>

      <footer style={{
        marginTop: 32,
        paddingTop: 20,
        paddingBottom: "max(20px, env(safe-area-inset-bottom))",
        borderTop: "1px solid #E8E5E1",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 13, color: "#888", fontWeight: 500 }}>
          Made in haste, play with a straight face. © R3GUn
        </div>
      </footer>
    </main>
  );
}
