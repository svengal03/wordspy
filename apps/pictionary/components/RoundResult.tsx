"use client";

interface Team {
  name: string;
  score: number;
  players: string[];
  drawerIdx: number;
}

interface Props {
  correct: boolean;
  word: string;
  teams: Team[];
  teamColors: string[];
  onNext: () => void;
  onEndGame: () => void;
}

export function RoundResult({ correct, word, teams, teamColors, onNext, onEndGame }: Props) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "'DM Sans', sans-serif",
        background: correct ? "#F0FFF4" : "#FAFAF8",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>{correct ? "🎉" : "⏭️"}</div>
        <h2
          style={{
            margin: "0 0 8px",
            fontSize: 28,
            fontWeight: 800,
            color: correct ? "#2BB34A" : "#1A1A1A",
          }}
        >
          {correct ? "Correct!" : "Skipped"}
        </h2>
        <p style={{ margin: 0, fontSize: 16, color: "#888" }}>
          The word was <strong style={{ color: "#1A1A1A" }}>{word}</strong>
        </p>
      </div>

      {/* Scores */}
      <div style={{ width: "100%", maxWidth: 320, display: "flex", gap: 12, marginBottom: 40 }}>
        {teams.map((team, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              background: "#fff",
              border: `1.5px solid ${teamColors[i]}30`,
              borderRadius: 14,
              padding: "16px 12px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 12, color: "#888", fontWeight: 500, marginBottom: 4 }}>{team.name}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: teamColors[i] }}>{team.score}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 320 }}>
        <button
          onClick={onNext}
          style={{
            width: "100%",
            padding: "14px 0",
            borderRadius: 12,
            border: "none",
            background: "#4A6CF7",
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Next Round →
        </button>
        <button
          onClick={onEndGame}
          style={{
            width: "100%",
            padding: "12px 0",
            borderRadius: 12,
            border: "1.5px solid #E8E5E1",
            background: "transparent",
            color: "#888",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          End Game
        </button>
      </div>
    </div>
  );
}
