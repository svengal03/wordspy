const games = [
  {
    name: "Wordspy",
    description: "Social deduction word game. Find the spy before they escape.",
    href: "http://localhost:3001",
    tag: "Play now",
    tagBg: "#CC785C",
  },
  {
    name: "Mafia",
    description: "Lies, alliances, and betrayal. Vote out the Mafia before it's too late.",
    href: "http://localhost:3002",
    tag: "Play now",
    tagBg: "#B0A99A",
  },
  {
    name: "Dumb Charades",
    description: "Act it out, no talking. Pass the phone, guess the word before time runs out.",
    href: "http://localhost:3003",
    tag: "Play now",
    tagBg: "#E85D2F",
  },
  {
    name: "Pictionary",
    description: "Draw it, guess it. No letters or numbers — just your artistic skills.",
    href: "http://localhost:3004",
    tag: "Play now",
    tagBg: "#4A6CF7",
  },
];

export default function HomePage() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#FAFAF8",
        fontFamily: "'DM Sans', sans-serif",
        padding: "48px 24px",
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      <header style={{ marginBottom: 48 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 32,
            fontWeight: 800,
            color: "#1A1A1A",
            letterSpacing: "-0.02em",
          }}
        >
          Playhub
        </h1>
        <p style={{ margin: "8px 0 0", fontSize: 15, color: "#888", fontWeight: 400 }}>
          Games for groups
        </p>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {games.map((game) => (
          <a
            key={game.name}
            href={game.href}
            style={{
              display: "block",
              background: "#fff",
              border: "1.5px solid #E8E5E1",
              borderRadius: 16,
              padding: "24px 20px",
              textDecoration: "none",
              transition: "box-shadow 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#1A1A1A",
                  letterSpacing: "-0.01em",
                }}
              >
                {game.name}
              </span>
              <span
                style={{
                  background: game.tagBg,
                  color: "#fff",
                  borderRadius: 8,
                  padding: "4px 10px",
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                {game.tag}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: "#666", lineHeight: 1.5, fontWeight: 400 }}>
              {game.description}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
