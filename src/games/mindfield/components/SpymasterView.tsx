"use client";
import { useState, useMemo, useEffect, useRef } from "react";

const NOOP = () => {};
import { tokens, PlayHubLogo, OptionsMenu } from "@playhub/ui";
import WordCard from "./WordCard";
import ClueInput from "./ClueInput";
import RulesModal from "./RulesModal";
import { TEAM_COLOR } from "./ui";
import type { GameState, Player, ClueEntry } from "../types";

interface Props {
  gameState: GameState;
  localPlayer: Player;
  onSubmitClue: (clue: string, num: number) => void;
  onSkipTurn?: () => void;
  onLeave: () => void;
  onNewGame?: () => void;
}

export default function SpymasterView({ gameState, localPlayer, onSubmitClue, onSkipTurn, onLeave, onNewGame }: Props) {
  const [showRules, setShowRules] = useState(false);
  const isMyTurn = gameState.currentTeam === localPlayer.team;
  const isGivingClue = gameState.turnPhase === "giving-clue";
  const showInput = isMyTurn && isGivingClue;

  const clueTimerSecs = gameState.config.clueTimerSecs ?? null;
  const [clueTimeLeft, setClueTimeLeft] = useState<number | null>(clueTimerSecs);
  const clueTimerExpiredRef = useRef(false);

  useEffect(() => {
    if (!showInput || !clueTimerSecs) { setClueTimeLeft(clueTimerSecs); clueTimerExpiredRef.current = false; return; }
    setClueTimeLeft(clueTimerSecs);
    clueTimerExpiredRef.current = false;
    const tick = setInterval(() => {
      setClueTimeLeft((t) => {
        if (t === null || t <= 1) {
          clearInterval(tick);
          if (!clueTimerExpiredRef.current) { clueTimerExpiredRef.current = true; onSkipTurn?.(); }
          return null;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInput, clueTimerSecs]);

  const { redLeft, blueLeft } = useMemo(() => {
    let r = 0, b = 0;
    for (const t of gameState.tiles) {
      if (t.revealed) continue;
      if (t.color === "red") r++;
      else if (t.color === "blue") b++;
    }
    return { redLeft: r, blueLeft: b };
  }, [gameState.tiles]);

  const flaggedSet = useMemo(
    () => new Set(gameState.flaggedTiles ?? []),
    [gameState.flaggedTiles]
  );

  const teamColor = gameState.currentTeam === "red" ? "#DC2626" : "#2563EB";
  const myTeamColor = localPlayer.team === "red" ? "#DC2626" : "#2563EB";

  return (
    <div style={{ minHeight: "100dvh", background: tokens.bg, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* TopBar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50, padding: "12px 16px",
        borderBottom: `0.5px solid ${tokens.border}`, background: tokens.bg,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <PlayHubLogo appName="Mind Field" href="/" />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
            background: `${myTeamColor}12`, color: myTeamColor, border: `1px solid ${myTeamColor}30`,
          }}>🗝️ SPYMASTER</span>
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

      <div style={{ padding: "12px 12px 24px", maxWidth: 480, margin: "0 auto" }}>
        {/* Score bar */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
          <ScoreChip color="red" left={redLeft} wins={gameState.redWins} pts={gameState.redPoints} active={gameState.currentTeam === "red"} />
          <div style={{ flex: 1 }} />
          <TurnIndicator gameState={gameState} />
          <div style={{ flex: 1 }} />
          <ScoreChip color="blue" left={blueLeft} wins={gameState.blueWins} pts={gameState.bluePoints} active={gameState.currentTeam === "blue"} />
        </div>

        {/* Current clue banner (when agents are guessing) */}
        {gameState.clue && !isGivingClue && (
          <div style={{
            background: `${teamColor}10`, border: `1.5px solid ${teamColor}30`,
            borderRadius: 12, padding: "10px 14px", marginBottom: 10,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: teamColor, whiteSpace: "nowrap" }}>
              {gameState.currentTeam === "red" ? "🔴 Red" : "🔵 Blue"} clue
            </div>
            <div style={{ flex: 1, fontSize: 20, fontWeight: 900, color: tokens.black, letterSpacing: -0.5 }}>
              {gameState.clue}
              <span style={{ fontSize: 14, color: tokens.grey2, marginLeft: 8, fontWeight: 600 }}>
                {gameState.clueNumber}
              </span>
            </div>
            <div style={{ fontSize: 11, color: tokens.grey3 }}>
              {gameState.guessesRemaining} left
            </div>
          </div>
        )}

        {/* Clue chat history */}
        <SpymasterClueChatBox clueHistory={gameState.clueHistory ?? []} currentClue={gameState.clue} />

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
              onTap={NOOP}
              flagged={flaggedSet.has(tile.id)}
              canFlag={false}
            />
          ))}
        </div>

        {/* Clue input or status */}
        {showInput ? (
          <>
            {clueTimerSecs && clueTimeLeft !== null && (
              <div style={{
                textAlign: "center", marginBottom: 8,
                fontSize: 13, fontWeight: 700,
                color: clueTimeLeft <= 15 ? "#DC2626" : tokens.grey2,
              }}>
                {clueTimeLeft <= 15 ? "⚠ " : "⏱ "}Clue timer: {clueTimeLeft}s
              </div>
            )}
            <ClueInput tiles={gameState.tiles} onSubmit={onSubmitClue} />
          </>
        ) : (
          <div style={{
            background: tokens.white, borderRadius: 12, padding: "14px", textAlign: "center",
            border: `1.5px solid ${tokens.border}`,
          }}>
            {isMyTurn && !isGivingClue
              ? <div style={{ color: tokens.grey2, fontSize: 14 }}>⏳ Your agents are guessing…</div>
              : <div style={{ color: tokens.grey2, fontSize: 14 }}>
                  Waiting for{" "}
                  <span style={{ color: teamColor, fontWeight: 700 }}>
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

function SpymasterClueChatBox({ clueHistory, currentClue }: { clueHistory: ClueEntry[]; currentClue: string | null }) {
  const teamColor = (t: "red" | "blue") => t === "red" ? "#DC2626" : "#2563EB";
  const historyEntries = currentClue
    ? clueHistory.slice(0, -1)
    : clueHistory;

  if (historyEntries.length === 0) return null;

  return (
    <div style={{
      background: tokens.white, border: `1.5px solid ${tokens.border}`, borderRadius: 12,
      padding: "10px 14px", marginBottom: 10,
      maxHeight: 140, overflowY: "auto",
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: tokens.grey3, letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 }}>
        Clue History
      </div>
      {historyEntries.map((entry, i) => {
        const tc = teamColor(entry.team);
        return (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <div style={{
              width: 26, height: 26, borderRadius: "50%",
              background: `${tc}12`, border: `1.5px solid ${tc}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, fontWeight: 700, color: tc, flexShrink: 0,
            }}>
              {entry.spymasterName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 10, color: tc, fontWeight: 700, marginBottom: 1 }}>{entry.spymasterName}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: tokens.black, lineHeight: 1.1 }}>
                {entry.clue}
                <span style={{ fontSize: 12, color: tokens.grey2, marginLeft: 6, fontWeight: 600 }}>{entry.clueNumber}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ScoreChip({
  color, left, wins, pts, active,
}: { color: "red" | "blue"; left: number; wins: number; pts: number; active: boolean }) {
  const c = color === "red"
    ? { text: "#DC2626", bg: active ? "#FEF2F2" : tokens.white, border: active ? "#DC262630" : tokens.border }
    : { text: "#2563EB", bg: active ? "#EFF6FF" : tokens.white, border: active ? "#2563EB30" : tokens.border };

  return (
    <div style={{
      padding: "8px 12px", borderRadius: 10, background: c.bg,
      border: `1.5px solid ${c.border}`,
      textAlign: "center", minWidth: 70,
    }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: c.text }}>{left} left</div>
      <div style={{ fontSize: 10, color: tokens.grey3 }}>{wins}W · {pts}pt</div>
    </div>
  );
}

function TurnIndicator({ gameState }: { gameState: GameState }) {
  const teamLabel = gameState.currentTeam === "red" ? "🔴 Red" : "🔵 Blue";
  const phaseLabel = gameState.turnPhase === "giving-clue" ? "Giving clue" : "Guessing";
  const phaseColor = gameState.turnPhase === "guessing" ? (gameState.currentTeam === "red" ? "#DC2626" : "#2563EB") : tokens.grey3;
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 11, color: tokens.grey2, fontWeight: 700 }}>{teamLabel}</div>
      <div style={{ fontSize: 10, color: phaseColor, fontWeight: 600 }}>{phaseLabel}</div>
    </div>
  );
}
