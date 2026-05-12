"use client";
import { useState } from "react";
import { CategoryPicker } from "./CategoryPicker";
import type { Team } from "@/lib/types";

interface Props {
  onStart: (teams: Team[], timerDuration: number, selectedPackIds: string[]) => void;
}

const TIMER_OPTIONS = [60, 90, 120];
const ACCENT = "#E85D2F";

export function SetupScreen({ onStart }: Props) {
  const [team1Name, setTeam1Name] = useState("Team 1");
  const [team2Name, setTeam2Name] = useState("Team 2");
  const [team1Players, setTeam1Players] = useState<string[]>(["Player 1"]);
  const [team2Players, setTeam2Players] = useState<string[]>(["Player 2"]);
  const [timerDuration, setTimerDuration] = useState(60);
  const [selectedPackIds, setSelectedPackIds] = useState<string[]>(["bollywood", "tollywood", "south-food", "north-food"]);

  const addPlayer = (team: 1 | 2) => {
    if (team === 1) setTeam1Players((p) => [...p, `Player ${p.length + 1}`]);
    else setTeam2Players((p) => [...p, `Player ${p.length + 1}`]);
  };

  const updatePlayer = (team: 1 | 2, idx: number, val: string) => {
    if (team === 1) setTeam1Players((p) => p.map((n, i) => (i === idx ? val : n)));
    else setTeam2Players((p) => p.map((n, i) => (i === idx ? val : n)));
  };

  const removePlayer = (team: 1 | 2, idx: number) => {
    if (team === 1) {
      if (team1Players.length === 1) return;
      setTeam1Players((p) => p.filter((_, i) => i !== idx));
    } else {
      if (team2Players.length === 1) return;
      setTeam2Players((p) => p.filter((_, i) => i !== idx));
    }
  };

  const handleStart = () => {
    const teams: Team[] = [
      { name: team1Name || "Team 1", score: 0, players: team1Players.filter(Boolean), actorIdx: 0 },
      { name: team2Name || "Team 2", score: 0, players: team2Players.filter(Boolean), actorIdx: 0 },
    ];
    onStart(teams, timerDuration, selectedPackIds);
  };

  return (
    <div style={{ padding: "32px 20px", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.02em" }}>
          🎭 Dumb Charades
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: 14, color: "#888" }}>
          Act it out. No talking. No sounds.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 28 }}>
        <TeamSection
          teamNum={1}
          name={team1Name}
          players={team1Players}
          accent={ACCENT}
          onNameChange={setTeam1Name}
          onPlayerChange={(i, v) => updatePlayer(1, i, v)}
          onAddPlayer={() => addPlayer(1)}
          onRemovePlayer={(i) => removePlayer(1, i)}
        />
        <TeamSection
          teamNum={2}
          name={team2Name}
          players={team2Players}
          accent="#4A6CF7"
          onNameChange={setTeam2Name}
          onPlayerChange={(i, v) => updatePlayer(2, i, v)}
          onAddPlayer={() => addPlayer(2)}
          onRemovePlayer={(i) => removePlayer(2, i)}
        />
      </div>

      <div style={{ marginBottom: 28 }}>
        <p style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>Timer</p>
        <div style={{ display: "flex", gap: 8 }}>
          {TIMER_OPTIONS.map((t) => (
            <button
              key={t}
              onClick={() => setTimerDuration(t)}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: 10,
                border: timerDuration === t ? `1.5px solid ${ACCENT}` : "1.5px solid #E8E5E1",
                background: timerDuration === t ? "#FFF3EF" : "#fff",
                color: timerDuration === t ? ACCENT : "#666",
                fontWeight: timerDuration === t ? 700 : 400,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              {t}s
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 32 }}>
        <CategoryPicker selected={selectedPackIds} onChange={setSelectedPackIds} />
      </div>

      <button
        onClick={handleStart}
        style={{
          width: "100%",
          padding: "16px 0",
          borderRadius: 14,
          border: "none",
          background: ACCENT,
          color: "#fff",
          fontSize: 16,
          fontWeight: 700,
          cursor: "pointer",
          letterSpacing: "-0.01em",
        }}
      >
        Start Game
      </button>
    </div>
  );
}

interface TeamSectionProps {
  teamNum: number;
  name: string;
  players: string[];
  accent: string;
  onNameChange: (v: string) => void;
  onPlayerChange: (i: number, v: string) => void;
  onAddPlayer: () => void;
  onRemovePlayer: (i: number) => void;
}

function TeamSection({ teamNum, name, players, accent, onNameChange, onPlayerChange, onAddPlayer, onRemovePlayer }: TeamSectionProps) {
  return (
    <div style={{ background: "#fff", border: "1.5px solid #E8E5E1", borderRadius: 14, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: accent }} />
        <input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            fontSize: 15,
            fontWeight: 700,
            color: "#1A1A1A",
            background: "transparent",
          }}
          placeholder={`Team ${teamNum}`}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {players.map((p, i) => (
          <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              value={p}
              onChange={(e) => onPlayerChange(i, e.target.value)}
              style={{
                flex: 1,
                padding: "8px 10px",
                borderRadius: 8,
                border: "1.5px solid #E8E5E1",
                fontSize: 13,
                color: "#1A1A1A",
                outline: "none",
                background: "#FAFAF8",
              }}
              placeholder={`Player ${i + 1}`}
            />
            {players.length > 1 && (
              <button
                onClick={() => onRemovePlayer(i)}
                style={{ border: "none", background: "none", color: "#CCC", fontSize: 16, cursor: "pointer", padding: "0 4px" }}
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button
          onClick={onAddPlayer}
          style={{
            padding: "7px 10px",
            borderRadius: 8,
            border: `1.5px dashed ${accent}40`,
            background: "transparent",
            color: accent,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          + Add player
        </button>
      </div>
    </div>
  );
}
