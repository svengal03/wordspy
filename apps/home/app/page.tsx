const games = [
  {
    name: "Wordspy",
    emoji: "🕵️",
    description: "Find the undercover before they escape.",
    href: "http://localhost:3001",
    accent: "#CC785C",
    bg: "#FFF8F5",
    players: "4–10",
  },
  {
    name: "Mafia",
    emoji: "🔪",
    description: "Lies, alliances, betrayal. Vote wisely.",
    href: "http://localhost:3002",
    accent: "#374151",
    bg: "#F9FAFB",
    players: "5–15",
  },
  {
    name: "Dumb Charades",
    emoji: "🎬",
    description: "Act it out, no talking. Guess before time runs out.",
    href: "http://localhost:3003",
    accent: "#E85D2F",
    bg: "#FFF3EF",
    players: "4+",
  },
  {
    name: "Pictionary",
    emoji: "🎨",
    description: "Draw it, guess it. No letters, just art.",
    href: "http://localhost:3004",
    accent: "#4A6CF7",
    bg: "#EEF2FF",
    players: "4+",
  },
];

export default function HomePage() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#FAFAF8",
        fontFamily: "'DM Sans', sans-serif",
        padding: "48px 20px 40px",
        maxWidth: 520,
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      <header style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.02em", lineHeight: 1 }}>
          PlayHub
        </div>
        <p style={{ margin: "6px 0 0", fontSize: 14, color: "#999", fontWeight: 400 }}>
          Party games for groups
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {games.map((game) => (
          <a
            key={game.name}
            href={game.href}
            style={{
              display: "flex",
              flexDirection: "column",
              background: "#fff",
              border: "1.5px solid #E8E5E1",
              borderRadius: 20,
              padding: "20px 16px",
              textDecoration: "none",
              transition: "box-shadow 0.15s ease",
              boxSizing: "border-box",
            }}
          >
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: game.bg, border: `1.5px solid ${game.accent}20`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26, marginBottom: 14,
            }}>
              {game.emoji}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A", letterSpacing: "-0.01em", marginBottom: 4 }}>
              {game.name}
            </div>
            <p style={{ margin: "0 0 14px", fontSize: 12, color: "#777", lineHeight: 1.45, fontWeight: 400, flex: 1 }}>
              {game.description}
            </p>
            <span style={{
              fontSize: 11, fontWeight: 700, color: game.accent,
              background: game.bg, border: `1px solid ${game.accent}30`,
              borderRadius: 6, padding: "3px 8px", letterSpacing: "0.04em",
              textTransform: "uppercase", alignSelf: "flex-start",
            }}>
              {game.players} players
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
