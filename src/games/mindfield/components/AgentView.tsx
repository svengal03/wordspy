"use client";
import { useState, useMemo, useRef, useCallback } from "react";
import { Btn, tokens, PlayHubLogo, OptionsMenu } from "@playhub/ui";
import WordCard from "./WordCard";
import RulesModal from "./RulesModal";
import type { GameState, Player, ClueEntry } from "../types";

interface Props {
  gameState: GameState;
  localPlayer: Player;
  onRevealTile: (tileId: number) => void;
  onFlagTile: (tileId: number) => void;
  onPass: () => void;
  onLeave: () => void;
  onNewGame?: () => void;
}

export default function AgentView({ gameState, localPlayer, onRevealTile, onFlagTile, onPass, onLeave, onNewGame }: Props) {
  const [showRules, setShowRules] = useState(false);
  const isMyTeam = gameState.currentTeam === localPlayer.team;
  const canGuess = isMyTeam && gameState.turnPhase === "guessing";

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

  // Stable callback refs so memoized WordCards don't re-render on every parent state change
  const revealRef = useRef(onRevealTile);
  revealRef.current = onRevealTile;
  const flagRef = useRef(onFlagTile);
  flagRef.current = onFlagTile;
  const stableReveal = useCallback((id: number) => revealRef.current(id), []);
  const stableFlag = useCallback((id: number) => flagRef.current(id), []);

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

        {/* Current clue banner */}
        {gameState.clue && (
          <CurrentClueBanner
            clue={gameState.clue}
            clueNumber={gameState.clueNumber}
            team={gameState.currentTeam}
            guessesRemaining={gameState.guessesRemaining}
            canGuess={canGuess}
          />
        )}

        {/* Clue chat history */}
        <ClueChatBox
          clueHistory={gameState.clueHistory ?? []}
          currentTeam={gameState.currentTeam}
          turnPhase={gameState.turnPhase}
          currentClue={gameState.clue}
          canGuess={canGuess}
          localTeam={localPlayer.team}
        />

        {/* Interaction hint — only while it's our team's turn to guess */}
        {canGuess && (
          <div style={{
            display: "flex", gap: 8, justifyContent: "center", alignItems: "center",
            margin: "0 0 8px", fontSize: 11, color: tokens.grey2, fontWeight: 600,
          }}>
            <span style={{
              padding: "4px 10px", borderRadius: 20, background: tokens.white,
              border: `1px solid ${tokens.border}`,
            }}>
              <b style={{ color: tokens.black }}>Hold</b> to reveal
            </span>
            <span style={{
              padding: "4px 10px", borderRadius: 20, background: tokens.white,
              border: `1px solid ${tokens.border}`,
            }}>
              <b style={{ color: tokens.black }}>Tap</b> to flag 🚩
            </span>
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
              viewerRole="agent"
              viewerTeam={localPlayer.team}
              activeTeam={gameState.currentTeam}
              canTap={canGuess && !tile.revealed}
              onTap={stableReveal}
              flagged={flaggedSet.has(tile.id)}
              canFlag={canGuess && !tile.revealed}
              onFlag={stableFlag}
            />
          ))}
        </div>

        {/* Pass button */}
        {canGuess && (
          <Btn variant="ghost" fullWidth onClick={onPass} style={{ padding: "13px", fontSize: 14 }}>
            Pass Turn
          </Btn>
        )}

        {/* Turn status */}
        {!isMyTeam && (
          <div style={{
            textAlign: "center", color: tokens.grey3, fontSize: 13,
            padding: "12px", background: tokens.white, borderRadius: 12,
            border: `1.5px solid ${tokens.border}`,
          }}>
            {gameState.turnPhase === "giving-clue"
              ? `${gameState.currentTeam === "red" ? "🔴 Red" : "🔵 Blue"} Spymaster is thinking…`
              : `${gameState.currentTeam === "red" ? "🔴 Red" : "🔵 Blue"} team is guessing…`
            }
          </div>
        )}
        {isMyTeam && gameState.turnPhase === "giving-clue" && (
          <div style={{
            textAlign: "center", color: tokens.grey3, fontSize: 13,
            padding: "12px", background: tokens.white, borderRadius: 12,
            border: `1.5px solid ${tokens.border}`,
          }}>
            ⏳ Your Spymaster is thinking…
          </div>
        )}
      </div>
    </div>
  );
}

function CurrentClueBanner({ clue, clueNumber, team, guessesRemaining, canGuess }: {
  clue: string;
  clueNumber: number | null;
  team: "red" | "blue";
  guessesRemaining: number;
  canGuess: boolean;
}) {
  const tc = team === "red" ? "#DC2626" : "#2563EB";
  const bg = team === "red" ? "#FEF2F2" : "#EFF6FF";
  return (
    <div style={{
      background: bg, border: `1.5px solid ${tc}30`,
      borderRadius: 12, padding: "10px 14px", marginBottom: 8,
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: tc, whiteSpace: "nowrap" }}>
        {team === "red" ? "🔴 Red" : "🔵 Blue"} clue
      </div>
      <div style={{ flex: 1, fontSize: 22, fontWeight: 900, color: tokens.black, letterSpacing: -0.5 }}>
        {clue}
        <span style={{ fontSize: 15, color: tokens.grey2, marginLeft: 8, fontWeight: 600 }}>
          {clueNumber}
        </span>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: tc }}>{guessesRemaining}</div>
        <div style={{ fontSize: 10, color: tokens.grey3 }}>left</div>
      </div>
      {canGuess && (
        <div style={{
          fontSize: 10, color: tc, fontWeight: 600,
          background: `${tc}15`, padding: "3px 8px", borderRadius: 20, whiteSpace: "nowrap",
        }}>Tap to guess</div>
      )}
    </div>
  );
}

function ClueChatBox({
  clueHistory, currentTeam, turnPhase, currentClue, canGuess, localTeam,
}: {
  clueHistory: ClueEntry[];
  currentTeam: "red" | "blue";
  turnPhase: string;
  currentClue: string | null;
  canGuess: boolean;
  localTeam: "red" | "blue" | null;
}) {
  const teamColor = (t: "red" | "blue") => t === "red" ? "#DC2626" : "#2563EB";
  // When a clue is active, it's already shown in the banner — only show past clues in history
  const historyEntries = currentClue ? clueHistory.slice(0, -1) : clueHistory;

  return (
    <div style={{
      background: tokens.white,
      border: `1.5px solid ${tokens.border}`,
      borderRadius: 14,
      marginBottom: 10,
      overflow: "hidden",
    }}>
      {/* Past clue history */}
      {historyEntries.length > 0 && (
        <div style={{
          maxHeight: 130,
          overflowY: "auto",
          padding: "10px 14px 6px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: tokens.grey3, letterSpacing: 1, textTransform: "uppercase" }}>
            Clue History
          </div>
          {historyEntries.map((entry, i) => {
            const tc = teamColor(entry.team);
            return (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: `${tc}12`,
                  border: `1.5px solid ${tc}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700, color: tc, flexShrink: 0,
                }}>
                  {entry.spymasterName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 10, color: tc, fontWeight: 700, marginBottom: 1 }}>
                    {entry.spymasterName}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: tokens.black, lineHeight: 1.1 }}>
                    {entry.clue}
                    <span style={{ fontSize: 12, color: tokens.grey2, marginLeft: 6, fontWeight: 600 }}>
                      {entry.clueNumber}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Status line */}
      <div style={{ padding: historyEntries.length > 0 ? "6px 14px 12px" : "12px 14px", textAlign: "center" }}>
        {currentClue ? (
          canGuess ? (
            <div style={{ fontSize: 12, color: tokens.grey3 }}>Tap a card to guess · Pass when done</div>
          ) : (
            <div style={{ fontSize: 12, color: tokens.grey3 }}>
              {currentTeam === "red" ? "🔴 Red" : "🔵 Blue"} team is guessing…
            </div>
          )
        ) : (
          <div style={{ color: tokens.grey3, fontSize: 13 }}>
            ⏳ Waiting for{" "}
            <span style={{ fontWeight: 700, color: teamColor(currentTeam) }}>
              {currentTeam === "red" ? "Red" : "Blue"}
            </span>{" "}Spymaster…
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
