export default function MafiaPage() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#FAFAF8",
        fontFamily: "'DM Sans', sans-serif",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <span
          style={{
            display: "inline-block",
            background: "#CC785C",
            color: "#fff",
            borderRadius: 12,
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Coming Soon
        </span>
      </div>

      <h1
        style={{
          margin: "0 0 12px",
          fontSize: 48,
          fontWeight: 800,
          color: "#1A1A1A",
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
        }}
      >
        Mafia
      </h1>

      <p
        style={{
          margin: "0 0 40px",
          fontSize: 17,
          fontWeight: 400,
          color: "#666",
          maxWidth: 320,
          lineHeight: 1.5,
        }}
      >
        Social deduction. Lies, alliances, and betrayal. Coming to Playhub soon.
      </p>

      <a
        href="http://localhost:3000"
        style={{
          display: "inline-block",
          color: "#CC785C",
          fontSize: 15,
          fontWeight: 600,
          textDecoration: "none",
          borderBottom: "1.5px solid #CC785C",
          paddingBottom: 2,
        }}
      >
        ← Back to Playhub
      </a>
    </div>
  );
}
