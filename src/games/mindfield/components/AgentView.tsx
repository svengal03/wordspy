"use client";
import { useState } from "react";
import { Btn, tokens, PlayHubLogo, OptionsMenu } from "@playhub/ui";
import WordCard from "./WordCard";
import RulesModal from "./RulesModal";
import type { GameState, Player } from "../types";

interface Props {
  gameState: GameState;
  localPlayer: Player;
  onRevealTile: (tileId: number) => void;
  onPass: () => void;
  onLeave: () => void;
  onNewGame?: () => void;
}

export default function AgentView({ gameState, localPlayer, onRevealTile, onPass, onLeave, onNewGame }: Props) {
  const [showRules, setShowRules] = useState(false);
  const isMyTeam = gameState.currentTeam === localPlayer.team;
  const canGuess = isMyTeam && gameState.turnPhase === "guessing";

  const redLeft = gameState.tiles.filter(t => t.color === "red" && !t.revealed).length;
  const blueLeft = gameState.tiles.filter(t => t.color === "blue" && !t.revealed).length;

  return (
    <div style={{ minHeight: "100dvh", background: tokens.bg, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* TopBar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50, padding: "12px 16px",
        borderBottom: "0.5px solid rgba(0,0,0,0.08)", background: tokens.bg,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <PlayHubLogo appName="Mind Field" href="/" />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setShowRules(true)}
            style={{
              padding: "6px 12px", borderRadius: 8, border: `1.5px solid ${tokens.border}`,
              background: tokens.white, cursor: "pointer", fontSize: 12, fontWeight: 600,
              color: tokens.grey1, fontFamily: "inherit",
            }}
          >Rules</button>
          <OptionsMenu onExit={onLeave} onNewGame={onNewGame} />
        </div>
      </div>

      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />

      <div style={{ padding: "12px 12px 28px", maxWidth: 480, margin: "0 auto" }}>
        {/* Score bar */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
          <AgentScoreChip
            color="red" left={redLeft} wins={gameState.redWins} pts={gameState.redPoints}
            active={gameState.currentTeam === "red"}
            isMyTeam={localPlayer.team === "red"}
          />
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: tokens.grey3, fontWeight: 700 }}>Round {gameState.round}</div>
            <div style={{ fontSize: 10, color: tokens.grey4 }}>of {gameState.config.targetWins} to win</div>
          </div>
          <AgentScoreChip
            color="blue" left={blueLeft} wins={gameState.blueWins} pts={gameState.bluePoints}
            active={gameState.currentTeam === "blue"}
            isMyTeam={localPlayer.team === "blue"}
          />
        </div>

        {/* Status / Clue banner */}
        <div style={{
          background: isMyTeam && gameState.turnPhase === "guessing"
            ? (localPlayer.team === "red" ? "#FEF2F2" : "#EFF6FF")
            : tokens.white,
          border: `1.5px solid ${isMyTeam && gameState.turnPhase === "guessing"
            ? (localPlayer.team === "red" ? "#DC262630" : "#2563EB30")
            : tokens.border}`,
          borderRadius: 14,
          padding: "12px 14px",
          marginBottom: 10,
          textAlign: "center",
        }}>
          {gameState.clue ? (
            <>
              <div style={{ fontSize: 11, color: tokens.grey3, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                {gameState.currentTeam === "red" ? "🔴 Red" : "🔵 Blue"} Spymaster&rsquo;s Clue
              </div>
              <div>
                <span style={{ fontSize: 26, fontWeight: 800, color: tokens.black }}>{gameState.clue}</span>
                <span style={{ fontSize: 20, color: tokens.grey2, marginLeft: 8 }}>{gameState.clueNumber}</span>
              </div>
              {canGuess && (
                <div style={{ fontSize: 12, color: tokens.grey3, marginTop: 4 }}>
                  {gameState.guessesRemaining} guess{gameState.guessesRemaining !== 1 ? "es" : ""} remaining — tap a word
                </div>
              )}
            </>
          ) : (
            <div style={{ color: tokens.grey3, fontSize: 14 }}>
              ⏳ Waiting for{" "}
              <span style={{
                fontWeight: 700,
                color: gameState.currentTeam === "red" ? "#DC2626" : "#2563EB",
              }}>
                {gameState.currentTeam === "red" ? "Red" : "Blue"}
              </span>{" "}Spymaster…
            </div>
          )}
        </div>

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
              viewerRole="agent"
              viewerTeam={localPlayer.team}
              activeTeam={gameState.currentTeam}
              canTap={canGuess && !tile.revealed}
              onTap={onRevealTile}
            />
          ))}
        </div>

        {/* Pass button */}
        {canGuess && (
          <Btn variant="ghost" fullWidth onClick={onPass} style={{ padding: "13px", fontSize: 14 }}>
            Pass Turn
          </Btn>
        )}

        {/* Not my turn */}
        {!isMyTeam && (
          <div style={{
            textAlign: "center", color: tokens.grey3, fontSize: 13,
            padding: "12px", background: tokens.white, borderRadius: 12,
            border: `1.5px solid ${tokens.border}`,
          }}>
            {gameState.currentTeam === "red" ? "🔴 Red" : "🔵 Blue"} team&rsquo;s turn
          </div>
        )}
        {isMyTeam && gameState.turnPhase === "giving-clue" && (
          <div style={{
            textAlign: "center", color: tokens.grey3, fontSize: 13,
            padding: "12px", background: tokens.white, borderRadius: 12,
            border: `1.5px solid ${tokens.border}`,
          }}>
            Your Spymaster is thinking…
          </div>
        )}
      </div>
    </div>
  );
}

function AgentScoreChip({
  color, left, wins, pts, active, isMyTeam,
}: { color: "red" | "blue"; left: number; wins: number; pts: number; active: boolean; isMyTeam: boolean }) {
  const c = color === "red"
    ? { text: "#DC2626", bg: active ? "#FEF2F2" : tokens.white, border: active ? "#DC262630" : tokens.border }
    : { text: "#2563EB", bg: active ? "#EFF6FF" : tokens.white, border: active ? "#2563EB30" : tokens.border };
  return (
    <div style={{
      padding: "8px 12px", borderRadius: 10, background: c.bg,
      border: `1.5px solid ${c.border}`, textAlign: "center", minWidth: 72,
      outline: isMyTeam ? `2px solid ${c.text}50` : "none", outlineOffset: 2,
    }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: c.text }}>{left} left</div>
      <div style={{ fontSize: 10, color: tokens.grey3 }}>{wins}W · {pts}pt</div>
    </div>
  );
}
