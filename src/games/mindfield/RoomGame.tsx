"use client";
import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMindFieldStore } from "./store";
import { useMindFieldRoom } from "./useRoom";
import { submitClue, endTurn, toggleFlag, revealTile, resetForPlayAgain } from "./engine";
import type { GameState, TeamColor, PlayerRole } from "./types";

import { ConfirmDialog, tokens } from "@playhub/ui";
import LobbyScreen from "./components/LobbyScreen";
import SpymasterView from "./components/SpymasterView";
import AgentView from "./components/AgentView";
import RoundOverScreen from "./components/RoundOverScreen";
import GameOverScreen from "./components/GameOverScreen";
import BombReveal from "./components/BombReveal";

export function MindFieldRoom() {
  const params = useParams();
  const roomCode = params.code as string;
  const router = useRouter();

  const { localPlayer, gameState, setGameState, setRoomCode, setLocalPlayer, reset } = useMindFieldStore();
  // Derive from gameState.players so role/team updates are always fresh
  const effectivePlayer = (gameState && localPlayer)
    ? (gameState.players.find(p => p.id === localPlayer.id) ?? localPlayer)
    : localPlayer;

  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showBomb, setShowBomb] = useState(false);
  const [isLoadingRoom, setIsLoadingRoom] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const leavingRef = useRef(false);
  const joinedRef = useRef(false);

  function syncShowBomb(s: GameState) {
    const ended = s.phase === "round-over" || s.phase === "game-over";
    const last = s.roundHistory[s.roundHistory.length - 1];
    setShowBomb(ended && last?.bombTriggered === true);
  }

  const { pushState, sendFlagBroadcast } = useMindFieldRoom(roomId, roomCode, (incoming) => {
    syncShowBomb(incoming);
    setGameState(incoming);
  });

  async function push(state: GameState) {
    const prev = gameState;
    setGameState(state);
    const ok = await pushState(roomCode, state);
    if (!ok && prev) setGameState(prev);
  }

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!roomCode) return;
    if (joinedRef.current) return;
    joinedRef.current = true;
    setRoomCode(roomCode);

    (async () => {
      try {
        if (localPlayer) {
          // Atomic server-side join: handles dedup by ID, name collision, and new players
          const joinRes = await fetch("/api/mindfield/rooms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "join", roomCode, playerData: localPlayer }),
          });

          if (joinRes.status === 409) {
            setRoomError("Game already in progress — can't join mid-game.");
            setTimeout(() => router.push("/mindfield"), 3000);
            return;
          }
          if (!joinRes.ok) {
            setRoomError("Room not found — the session may have ended.");
            setTimeout(() => router.push("/mindfield"), 3000);
            return;
          }

          const joinData = await joinRes.json();
          if (joinData.player.id !== localPlayer.id) {
            setLocalPlayer(joinData.player);
          }
          setGameState(joinData.gameState);
          // Join response includes roomId — skip the extra state fetch
          if (joinData.roomId) {
            setRoomId(joinData.roomId);
            return;
          }
        }

        // Spectator (no localPlayer) or legacy fallback — fetch roomId via state endpoint
        const stateRes = await fetch(`/api/mindfield/rooms/${roomCode}/state`);
        if (!stateRes.ok) {
          if (!localPlayer) {
            setRoomError("Room not found — the session may have ended.");
            setTimeout(() => router.push("/mindfield"), 3000);
          }
          return;
        }
        const stateData = await stateRes.json();
        setRoomId(stateData.roomId);

        if (!localPlayer) {
          setGameState(stateData.gameState as GameState);
        }
      } catch {
        setRoomError("Connection error — taking you home…");
        setTimeout(() => router.push("/mindfield"), 3000);
      } finally {
        setIsLoadingRoom(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode]);

  // ── Lobby actions ─────────────────────────────────────────────────────────
  async function handleAssignTeam(playerId: string, team: TeamColor | null) {
    if (!gameState) return;
    // Reset role on any team change so a spymaster swapping teams doesn't bring the role
    // along (would otherwise produce two spymasters on the destination team).
    const players = gameState.players.map(p => {
      if (p.id !== playerId) return p;
      const switchingTeam = team !== p.team;
      const nextRole: PlayerRole | null = team
        ? switchingTeam ? "agent" : (p.role ?? "agent")
        : null;
      return { ...p, team, role: nextRole };
    });
    await push({ ...gameState, players });
  }

  async function handleAssignSpymaster(playerId: string) {
    if (!gameState) return;
    const target = gameState.players.find(p => p.id === playerId);
    if (!target?.team) return;
    const isAlreadySpy = target.role === "spymaster";
    const players = gameState.players.map(p => {
      if (p.id === playerId) return { ...p, role: isAlreadySpy ? "agent" as const : "spymaster" as const };
      if (!isAlreadySpy && p.team === target.team && p.role === "spymaster") return { ...p, role: "agent" as const };
      return p;
    });
    await push({ ...gameState, players });
  }

  async function handleUpdatePackId(packId: string) {
    if (!gameState) return;
    await push({ ...gameState, config: { ...gameState.config, packId } });
  }

  async function handleUpdateTargetWins(n: number) {
    if (!gameState) return;
    await push({ ...gameState, config: { ...gameState.config, targetWins: n } });
  }

  async function handleUpdateTimers(clueTimerSecs: 60 | 120 | 180 | null, guessTimerSecs: 30 | 60 | null) {
    if (!gameState) return;
    await push({ ...gameState, config: { ...gameState.config, clueTimerSecs, guessTimerSecs } });
  }

  async function handleStart() {
    if (!gameState || isStarting) return;
    setIsStarting(true);
    try {
      const res = await fetch(`/api/mindfield/rooms/${roomCode}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setGameState(data.gameState);
    } catch {} finally {
      setIsStarting(false);
    }
  }

  async function handleRemovePlayer(id: string) {
    if (!gameState) return;
    const removedPlayer = gameState.players.find(p => p.id === id);
    let remaining = gameState.players.filter(p => p.id !== id);
    if (removedPlayer?.isHost && remaining.length > 0) {
      remaining = remaining.map((p, i) => i === 0 ? { ...p, isHost: true } : p);
    }
    await push({ ...gameState, players: remaining });
  }

  // ── Playing actions ───────────────────────────────────────────────────────
  async function handleSubmitClue(clue: string, num: number) {
    if (!gameState || !effectivePlayer) return;
    if (effectivePlayer.role !== "spymaster") return;
    if (gameState.currentTeam !== effectivePlayer.team) return;
    const updated = submitClue(gameState, clue, num, effectivePlayer.name);
    await push(updated);
  }

  async function handleRevealTile(tileId: number) {
    if (!gameState || !effectivePlayer) return;
    if (effectivePlayer.role !== "agent") return;
    if (gameState.currentTeam !== effectivePlayer.team) return;
    if (gameState.turnPhase !== "guessing") return;

    // Optimistic update — show result instantly
    const prev = gameState;
    const optimistic = revealTile(gameState, tileId);
    setGameState(optimistic);
    syncShowBomb(optimistic);

    try {
      const res = await fetch(`/api/mindfield/rooms/${roomCode}/reveal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tileId }),
      });
      const data = await res.json();
      // 409 = tile already revealed by concurrent click — server returns fresh state
      if (!res.ok) {
        const reverted = (data.gameState as GameState) ?? prev;
        setGameState(reverted);
        syncShowBomb(reverted);
        return;
      }
      const confirmed = data.gameState as GameState;
      setGameState(confirmed);
      syncShowBomb(confirmed);
    } catch {
      setGameState(prev);
      syncShowBomb(prev);
    }
  }

  function handleFlagTile(tileId: number) {
    if (!gameState || !effectivePlayer) return;
    if (effectivePlayer.role !== "agent") return;
    if (gameState.currentTeam !== effectivePlayer.team) return;
    if (gameState.turnPhase !== "guessing") return;
    // Flags are ephemeral within a turn — engine.endTurn() clears them. Skip persistence;
    // realtime broadcast is enough for teammates' devices, and late joiners simply start
    // with no flags. Saves a PATCH /state per flag click.
    const newState = toggleFlag(gameState, tileId);
    setGameState(newState);
    sendFlagBroadcast(newState.flaggedTiles);
  }

  async function handleSkipTurn() {
    if (!gameState || !effectivePlayer) return;
    if (effectivePlayer.role !== "spymaster") return;
    if (gameState.currentTeam !== effectivePlayer.team) return;
    if (gameState.turnPhase !== "giving-clue") return;
    const updated = endTurn(gameState);
    await push(updated);
  }

  async function handlePass() {
    if (!gameState || !effectivePlayer) return;
    if (effectivePlayer.role !== "agent") return;
    if (gameState.currentTeam !== effectivePlayer.team) return;
    if (gameState.turnPhase !== "guessing") return;
    const updated = endTurn(gameState);
    await push(updated);
  }

  // ── Round/Game transitions ────────────────────────────────────────────────
  async function handleNextRound() {
    if (!gameState || isStarting) return;
    setShowBomb(false);
    setIsStarting(true);
    try {
      const res = await fetch(`/api/mindfield/rooms/${roomCode}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "next-round" }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setGameState(data.gameState);
    } catch {} finally {
      setIsStarting(false);
    }
  }

  async function handlePlayAgain() {
    if (!gameState) return;
    await push(resetForPlayAgain(gameState));
  }

  function handleLeave() {
    if (!localPlayer) return;
    setShowLeaveDialog(true);
  }

  async function confirmLeave() {
    if (!localPlayer) return;
    setShowLeaveDialog(false);
    leavingRef.current = true;
    await handleRemovePlayer(localPlayer.id);
    reset();
    router.push("/mindfield");
  }

  // ── Loading / error states ────────────────────────────────────────────────
  // Only check kicked AFTER initial load — prevents false positive when gameState
  // hasn't been populated yet (e.g. first navigation, refresh).
  const isKicked = !isLoadingRoom && !leavingRef.current && gameState && localPlayer
    && gameState.phase === "lobby"
    && !gameState.players.find(p => p.id === localPlayer.id);

  if (isLoadingRoom || !gameState || isKicked) {
    const isError = !!roomError || !!isKicked;
    const msg = isKicked
      ? "You were removed from the room."
      : roomError ?? "Loading room…";
    return (
      <div style={{
        minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 12, fontFamily: "system-ui",
      }}>
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: isError ? tokens.red : tokens.coral }} />
        <div style={{ color: isError ? tokens.red : tokens.grey2, textAlign: "center", maxWidth: 280, lineHeight: 1.5 }}>{msg}</div>
        <button
          onClick={() => router.push("/mindfield")}
          style={{
            marginTop: 8, padding: "10px 24px", borderRadius: 10, border: `1.5px solid ${tokens.border}`,
            background: tokens.white, cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit",
          }}
        >
          ← PlayHub
        </button>
      </div>
    );
  }

  // Spectator: no localPlayer but game is loaded — show read-only view
  if (!localPlayer) {
    return <SpectatorView gameState={gameState} onLeave={() => router.push("/mindfield")} />;
  }

  const { phase } = gameState;
  const leaveLabel = localPlayer.isHost ? "End game?" : "Leave this game?";

  let content: React.ReactNode = null;

  // ── Bomb overlay ──────────────────────────────────────────────────────────
  if (showBomb && gameState.bombTriggeredBy) {
    const bombTile = gameState.tiles.find(t => t.color === "bomb" && t.revealed);
    content = (
      <>
        <BombReveal triggeredBy={gameState.bombTriggeredBy} word={bombTile?.word ?? "???"} />
        <div style={{ position: "fixed", bottom: 40, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, zIndex: 300 }}>
          {localPlayer.isHost ? (
            <button
              onClick={phase === "game-over" ? handlePlayAgain : handleNextRound}
              disabled={isStarting}
              style={{
                padding: "14px 32px", borderRadius: 14, background: tokens.coral, color: tokens.white,
                border: "none", fontSize: 16, fontWeight: 700, cursor: isStarting ? "default" : "pointer",
                fontFamily: "inherit", opacity: isStarting ? 0.6 : 1,
              }}
            >
              {isStarting ? "Loading…" : phase === "game-over" ? "Play Again →" : "Next Round →"}
            </button>
          ) : (
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>Waiting for host…</div>
          )}
          <button
            onClick={handleLeave}
            style={{
              padding: "8px 20px", borderRadius: 10, background: "transparent", color: "rgba(255,255,255,0.4)",
              border: "1px solid rgba(255,255,255,0.2)", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Leave Game
          </button>
        </div>
      </>
    );
  } else if (phase === "lobby") {
    // ── Lobby ─────────────────────────────────────────────────────────────
    content = (
      <LobbyScreen
        gameState={gameState}
        localPlayer={localPlayer}
        onAssignTeam={handleAssignTeam}
        onAssignSpymaster={handleAssignSpymaster}
        onUpdatePackId={handleUpdatePackId}
        onUpdateTargetWins={handleUpdateTargetWins}
        onUpdateTimers={handleUpdateTimers}
        onStart={handleStart}
        isStarting={isStarting}
        onRemovePlayer={handleRemovePlayer}
        onLeave={handleLeave}
      />
    );
  } else if (effectivePlayer) {
    // ── Playing ─────────────────────────────────────────────────────────────
    const newGame = effectivePlayer.isHost ? handlePlayAgain : undefined;

    if (phase === "playing") {
      content = effectivePlayer.role === "spymaster" ? (
        <SpymasterView
          gameState={gameState}
          localPlayer={effectivePlayer}
          onSubmitClue={handleSubmitClue}
          onSkipTurn={handleSkipTurn}
          onLeave={handleLeave}
          onNewGame={newGame}
        />
      ) : (
        <AgentView
          gameState={gameState}
          localPlayer={effectivePlayer}
          onRevealTile={handleRevealTile}
          onFlagTile={handleFlagTile}
          onPass={handlePass}
          onLeave={handleLeave}
          onNewGame={newGame}
        />
      );
    } else if (phase === "round-over") {
      content = (
        <RoundOverScreen
          gameState={gameState}
          localPlayer={effectivePlayer}
          onNextRound={handleNextRound}
          onLeave={handleLeave}
          onNewGame={newGame}
        />
      );
    } else if (phase === "game-over") {
      content = (
        <GameOverScreen
          gameState={gameState}
          localPlayer={effectivePlayer}
          onPlayAgain={handlePlayAgain}
          onLeave={handleLeave}
        />
      );
    }
  }

  return (
    <>
      {content}
      <ConfirmDialog
        open={showLeaveDialog}
        title={leaveLabel}
        confirmLabel={localPlayer.isHost ? "End Game" : "Leave"}
        cancelLabel="Stay"
        dangerous
        onConfirm={confirmLeave}
        onCancel={() => setShowLeaveDialog(false)}
      />
    </>
  );
}

// ── Spectator View ─────────────────────────────────────────────────────────────
function SpectatorView({ gameState, onLeave }: { gameState: import("./types").GameState; onLeave: () => void }) {
  const teamColor = (t: "red" | "blue") => t === "red" ? "#DC2626" : "#2563EB";
  const tc = teamColor(gameState.currentTeam);
  return (
    <div style={{ minHeight: "100dvh", background: tokens.bg, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{
        position: "sticky", top: 0, zIndex: 50, padding: "12px 16px",
        borderBottom: `1px solid ${tokens.border}`, background: tokens.bg,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: tokens.black, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: tokens.coral }} />
          Mind Field
          <span style={{ fontSize: 11, fontWeight: 600, color: tokens.grey3, marginLeft: 4 }}>SPECTATOR</span>
        </div>
        <button onClick={onLeave} style={{ padding: "6px 14px", borderRadius: 8, border: `1.5px solid ${tokens.border}`, background: tokens.white, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit", color: tokens.grey1 }}>Leave</button>
      </div>
      <div style={{ padding: "12px 12px 28px", maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center", justifyContent: "center" }}>
          {(["red", "blue"] as const).map((team) => {
            const c = teamColor(team);
            const active = gameState.currentTeam === team;
            return (
              <div key={team} style={{ padding: "8px 16px", borderRadius: 10, border: `1.5px solid ${active ? c + "50" : tokens.border}`, background: active ? c + "10" : tokens.white, textAlign: "center", minWidth: 90 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: c, display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: c, display: "inline-block" }} />
                  {team === "red" ? "Red" : "Blue"}
                </div>
                <div style={{ fontSize: 10, color: tokens.grey3 }}>{team === "red" ? gameState.redWins : gameState.blueWins}W · {team === "red" ? gameState.redPoints : gameState.bluePoints}pt</div>
              </div>
            );
          })}
        </div>
        {gameState.clue && (
          <div style={{ background: tc + "10", border: `1.5px solid ${tc}30`, borderRadius: 12, padding: "10px 14px", marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: tc, display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: tc, display: "inline-block" }} />
              {gameState.currentTeam === "red" ? "Red" : "Blue"} clue
            </div>
            <div style={{ flex: 1, fontSize: 20, fontWeight: 900, color: tokens.black }}>{gameState.clue} <span style={{ fontSize: 14, color: tokens.grey2, fontWeight: 600 }}>{gameState.clueNumber}</span></div>
            <div style={{ fontSize: 12, fontWeight: 700, color: tc }}>{gameState.guessesRemaining} left</div>
          </div>
        )}
        {!gameState.clue && (
          <div style={{ textAlign: "center", color: tokens.grey2, fontSize: 13, marginBottom: 10 }}>
            {gameState.currentTeam === "red" ? "Red" : "Blue"} Spymaster is giving a clue…
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 7, marginBottom: 12 }}>
          {gameState.tiles.map(tile => {
            const revealed = tile.revealed;
            const bg = revealed
              ? tile.color === "red" ? tokens.redBg : tile.color === "blue" ? tokens.blueBg : tile.color === "bomb" ? tokens.black : "#F5F5F5"
              : tokens.white;
            const textColor = revealed && tile.color === "bomb" ? tokens.white : revealed && tile.color === "red" ? tokens.red : revealed && tile.color === "blue" ? tokens.blue : tokens.black;
            return (
              <div key={tile.id} style={{ borderRadius: 8, border: `1.5px solid ${tokens.border}`, background: bg, padding: "8px 4px", textAlign: "center", fontSize: 11, fontWeight: 600, color: revealed ? textColor : tokens.grey1, opacity: revealed ? 0.7 : 1, lineHeight: 1.2 }}>
                {tile.word}
              </div>
            );
          })}
        </div>
        <div style={{ textAlign: "center", color: tokens.grey4, fontSize: 12 }}>Round {gameState.round} · Watching as spectator</div>
      </div>
    </div>
  );
}
