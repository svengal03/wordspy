"use client";
import { useState } from "react";
import { tokens, PlayHubLogo, OptionsMenu } from "@playhub/ui";
import WordCard from "./WordCard";
import ClueInput from "./ClueInput";
import RulesModal from "./RulesModal";
import { TEAM_COLOR } from "./ui";
import type { GameState, Player } from "../types";

interface Props {
  gameState: GameState;
  localPlayer: Player;
  onSubmitClue: (clue: string, num: number) => void;
  onLeave: () => void;
  onNewGame?: () => void;
}

export default function SpymasterView({ gameState, localPlayer, onSubmitClue, onLeave, onNewGame }: Props) {
  const [showRules, setShowRules] = useState(false);
  const isMyTurn = gameState.currentTeam === localPlayer.team;
  const isGivingClue = gameState.turnPhase === "giving-clue";
  const showInput = isMyTurn && isGivingClue;

  const redLeft = gameState.tiles.filter(t => t.color === "red" && !t.revealed).length;
  const blueLeft = gameState.tiles.filter(t => t.color === "blue" && !t.revealed).length;

  return (
    <div style={{ minHeight: "100dvh", background: "#0F0F0F", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* TopBar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50, padding: "12px 16px",
        borderBottom: "0.5px solid #222", background: "#0F0F0F",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <PlayHubLogo appName="Mind Field" href="/" />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
            background: "#1A1A1A", color: "#888",
          }}>🗝️ SPYMASTER</span>
          <button
            onClick={() => setShowRules(true)}
            style={{
              padding: "6px 12px", borderRadius: 8, border: "1px solid #333",
              background: "transparent", cursor: "pointer", fontSize: 12, fontWeight: 600,
              color: "#666", fontFamily: "inherit",
            }}
          >Rules</button>
          <OptionsMenu onExit={onLeave} onNewGame={onNewGame} />
        </div>
      </div>

      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />

      <div style={{ padding: "12px 12px 24px", maxWidth: 480, margin: "0 auto" }}>
        {/* Score bar */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
          <ScoreChip color="red" left={redLeft} wins={gameState.redWins} pts={gameState.redPoints} active={gameState.currentTeam === "red"} />
          <div style={{ flex: 1 }} />
          <TurnIndicator gameState={gameState} />
          <div style={{ flex: 1 }} />
          <ScoreChip color="blue" left={blueLeft} wins={gameState.blueWins} pts={gameState.bluePoints} active={gameState.currentTeam === "blue"} />
        </div>

        {/* Current clue display */}
        {gameState.clue && (
          <div style={{
            background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: 12,
            padding: "10px 14px", marginBottom: 10, textAlign: "center",
          }}>
            <div style={{ fontSize: 11, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
              Clue
            </div>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{gameState.clue}</span>
            <span style={{ fontSize: 18, color: "#888", marginLeft: 8 }}>{gameState.clueNumber}</span>
            <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
              {gameState.guessesRemaining} guess{gameState.guessesRemaining !== 1 ? "es" : ""} remaining
            </div>
          </div>
        )}

        {/* Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 7,
          marginBottom: 12,
        }}>
          {gameState.tiles.map(tile => (
            <WordCard
              key={tile.id}
              tile={tile}
              viewerRole="spymaster"
              viewerTeam={localPlayer.team}
              activeTeam={gameState.currentTeam}
              canTap={false}
              onTap={() => {}}
            />
          ))}
        </div>

        {/* Clue input or status */}
        {showInput ? (
          <ClueInput tiles={gameState.tiles} onSubmit={onSubmitClue} />
        ) : (
          <div style={{
            background: "#1A1A1A", borderRadius: 12, padding: "14px", textAlign: "center",
            border: "1px solid #2A2A2A",
          }}>
            {isMyTurn && !isGivingClue
              ? <div style={{ color: "#888", fontSize: 14 }}>⏳ Your agents are guessing…</div>
              : <div style={{ color: "#555", fontSize: 14 }}>
                  Waiting for{" "}
                  <span style={{ color: gameState.currentTeam === "red" ? "#EF4444" : "#3B82F6", fontWeight: 700 }}>
                    {gameState.currentTeam === "red" ? "Red" : "Blue"} Spymaster
                  </span>
                  {" "}to give a clue…
                </div>
            }
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreChip({
  color, left, wins, pts, active,
}: { color: "red" | "blue"; left: number; wins: number; pts: number; active: boolean }) {
  const c = color === "red"
    ? { text: "#EF4444", bg: active ? "#1A0A0A" : "#111" }
    : { text: "#3B82F6", bg: active ? "#0A0A1A" : "#111" };

  return (
    <div style={{
      padding: "8px 12px", borderRadius: 10, background: c.bg,
      border: `1.5px solid ${active ? c.text + "50" : "#222"}`,
      textAlign: "center", minWidth: 70,
    }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: c.text }}>{left} left</div>
      <div style={{ fontSize: 10, color: "#555" }}>{wins}W · {pts}pt</div>
    </div>
  );
}

function TurnIndicator({ gameState }: { gameState: GameState }) {
  const teamLabel = gameState.currentTeam === "red" ? "🔴 Red" : "🔵 Blue";
  const phaseLabel = gameState.turnPhase === "giving-clue" ? "Giving clue" : "Guessing";
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 11, color: "#555", fontWeight: 700 }}>{teamLabel}</div>
      <div style={{ fontSize: 10, color: "#444" }}>{phaseLabel}</div>
    </div>
  );
}
