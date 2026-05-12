"use client";

interface Team {
  name: string;
  score: number;
  players: string[];
  actorIdx: number;
}

interface Props {
  teams: Team[];
  teamColors: string[];
  onPlayAgain: () => void;
}

export function GameOver({ teams, teamColors, onPlayAgain }: Props) {
  const sorted = [...teams].sort((a, b) => b.score - a.score);
  const tied = sorted[0].score === sorted[1]?.score;
  const winner = sorted[0];

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        fontFamily: "'DM Sans', sans-serif",
        background: "#FAFAF8",
      }}
    >
      <div style={{ fontSize: 64, marginBottom: 16 }}>🏆</div>

      <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 800, color: "#1A1A1A", textAlign: "center" }}>
        {tied ? "It's a tie!" : `${winner.name} wins!`}
      </h1>
      <p style={{ margin: "0 0 40px", fontSize: 14, color: "#888", textAlign: "center" }}>
        {tied ? "Nobody loses today." : "Well played."}
      </p>

      <div style={{ width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", gap: 12, marginBottom: 48 }}>
        {sorted.map((team, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#fff",
              border: `1.5px solid ${teamColors[teams.indexOf(team)]}30`,
              borderRadius: 14,
              padding: "16px 20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 20 }}>{i === 0 && !tied ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A" }}>{team.name}</div>
                <div style={{ fontSize: 12, color: "#888" }}>{team.players.join(", ")}</div>
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: teamColors[teams.indexOf(team)] }}>
              {team.score}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onPlayAgain}
        style={{
          width: "100%",
          maxWidth: 320,
          padding: "16px 0",
          borderRadius: 14,
          border: "none",
          background: "#E85D2F",
          color: "#fff",
          fontSize: 16,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Play Again
      </button>
    </div>
  );
}
