"use client";
import { useState } from "react";

interface Props {
  drawerName: string;
  teamName: string;
  teamColor: string;
  word: string;
  onReady: () => void;
}

export function WordReveal({ drawerName, teamName, teamColor, word, onReady }: Props) {
  const [revealed, setRevealed] = useState(false);

  if (!revealed) {
    return (
      <div style={screen}>
        <div style={card}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🙈</div>
          <p style={{ margin: "0 0 6px", fontSize: 13, color: "#888", fontWeight: 500 }}>
            Others look away
          </p>
          <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "#1A1A1A" }}>
            Pass phone to
          </h2>
          <div style={{ fontSize: 24, fontWeight: 800, color: teamColor, marginBottom: 8 }}>
            {drawerName}
          </div>
          <p style={{ margin: "0 0 32px", fontSize: 12, color: "#AAA" }}>
            {teamName}
          </p>
          <button onClick={() => setRevealed(true)} style={{ ...primaryBtn, background: teamColor }}>
            Tap to see word
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={screen}>
      <div style={card}>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "#888", fontWeight: 500 }}>
          Your word is
        </p>
        <div
          style={{
            fontSize: 36,
            fontWeight: 800,
            color: "#1A1A1A",
            letterSpacing: "-0.02em",
            marginBottom: 8,
            lineHeight: 1.2,
            textAlign: "center",
          }}
        >
          {word}
        </div>
        <p style={{ margin: "0 0 40px", fontSize: 12, color: "#AAA", textAlign: "center" }}>
          Draw only. No letters, numbers, or speaking.
        </p>
        <button onClick={onReady} style={{ ...primaryBtn, background: teamColor }}>
          Start Drawing →
        </button>
      </div>
    </div>
  );
}

const screen: React.CSSProperties = {
  minHeight: "100dvh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  fontFamily: "'DM Sans', sans-serif",
  background: "#FAFAF8",
};

const card: React.CSSProperties = {
  width: "100%",
  maxWidth: 360,
  background: "#fff",
  borderRadius: 20,
  border: "1.5px solid #E8E5E1",
  padding: "40px 28px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
};

const primaryBtn: React.CSSProperties = {
  width: "100%",
  padding: "14px 0",
  borderRadius: 12,
  border: "none",
  color: "#fff",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
};
